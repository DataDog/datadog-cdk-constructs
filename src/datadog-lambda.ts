/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { Tags, Stack } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { ISecret, Secret } from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import log from "loglevel";
import {
  applyLayers,
  redirectHandlers,
  addForwarder,
  addForwarderToLogGroups,
  applyEnvVariables,
  TagKeys,
  DatadogLambdaStrictProps,
  setGitEnvironmentVariables,
  setDDEnvVariables,
  DatadogLambdaDefaultProps,
  DatadogLambdaProps,
  Transport,
  applyExtensionLayer,
  DD_TAGS,
  siteList,
  invalidSiteError,
} from "./index";
import { DatadogAppSecMode, LambdaFunction } from "./interfaces";
import { setTags } from "./tag";

const versionJson = require("../version.json");

export class DatadogLambda extends Construct {
  scope: Construct;
  props: DatadogLambdaProps;
  transport: Transport;
  gitCommitShaOverride: string | undefined;
  gitRepoUrlOverride: string | undefined;
  lambdas: LambdaFunction[];
  contextGitShaOverrideKey: string = "datadog-lambda.git-commit-sha-override";

  constructor(scope: Construct, id: string, props: DatadogLambdaProps) {
    if (process.env.DD_CONSTRUCT_DEBUG_LOGS?.toLowerCase() === "true") {
      log.setLevel("debug");
    }
    super(scope, id);
    this.scope = scope;
    this.props = props;
    this.lambdas = [];
    let apiKeySecretArn = this.props.apiKeySecretArn;
    if (this.props.apiKeySecret !== undefined) {
      apiKeySecretArn = this.props.apiKeySecret.secretArn;
    }
    validateProps(this.props, this.props.apiKeySecret !== undefined);
    this.transport = new Transport(
      this.props.flushMetricsToLogs,
      this.props.site,
      this.props.apiKey,
      apiKeySecretArn,
      this.props.apiKeySsmArn,
      this.props.apiKmsKey,
      this.props.extensionLayerVersion,
      this.props.extensionLayerArn,
    );

    const gitCommitShaOverride = this.node.tryGetContext(this.contextGitShaOverrideKey);
    if (gitCommitShaOverride) {
      this.overrideGitMetadata(gitCommitShaOverride);
    }
  }

  public addLambdaFunctions(lambdaFunctions: LambdaFunction[], construct?: Construct): void {
    // baseProps contains all properties set by the user, with default values for properties
    // defined in DefaultDatadogProps (if not set by user)
    const baseProps: DatadogLambdaStrictProps = handleSettingPropDefaults(this.props);

    const extractedLambdaFunctions = extractSingletonFunctions(lambdaFunctions);

    if (extractedLambdaFunctions.length === 0) {
      return;
    }

    const region = extractedLambdaFunctions[0].env.region;
    log.debug(`Using region: ${region}`);

    for (const lambdaFunction of extractedLambdaFunctions) {
      if (this.props.apiKeySecret !== undefined) {
        grantReadLambda(this.props.apiKeySecret, lambdaFunction);
      } else if (
        this.props.apiKeySecretArn !== undefined &&
        construct !== undefined &&
        baseProps.grantSecretReadAccess
      ) {
        log.debug("Granting read access to the provided Secret ARN for all your lambda functions.");
        grantReadLambdaFromSecretArn(construct, this.props.apiKeySecretArn, lambdaFunction);
      } else if (this.props.apiKeySsmArn !== undefined && construct !== undefined && baseProps.grantSecretReadAccess) {
        log.debug("Granting read access to the provided SSM Parameter ARN for all your lambda functions.");
        grantReadLambdaFromSsmParameterArn(this.props.apiKeySsmArn, lambdaFunction);
      }

      if (baseProps.addLayers) {
        const errors = applyLayers(
          this.scope,
          region,
          lambdaFunction,
          this.props.pythonLayerVersion,
          this.props.pythonLayerArn,
          this.props.nodeLayerVersion,
          this.props.nodeLayerArn,
          this.props.javaLayerVersion,
          this.props.javaLayerArn,
          this.props.dotnetLayerVersion,
          this.props.dotnetLayerArn,
          this.props.rubyLayerVersion,
          this.props.rubyLayerArn,
          this.props.useLayersFromAccount,
        );
        if (errors.length > 0) {
          log.warn(
            `Failed to apply layers to the Lambda function ${lambdaFunction.functionName}. Skipping instrumenting it.`,
          );
          continue;
        }
      }

      const useExtension = baseProps.extensionLayerVersion !== undefined || baseProps.extensionLayerArn !== undefined;
      if (useExtension) {
        const errors = applyExtensionLayer(
          this.scope,
          region,
          lambdaFunction,
          baseProps.extensionLayerVersion,
          baseProps.extensionLayerArn,
          this.props.useLayersFromAccount,
        );
        if (errors.length > 0) {
          log.warn(
            `Failed to apply extension layer to the Lambda function ${lambdaFunction.functionName}. Skipping instrumenting it.`,
          );
          continue;
        }
      }

      if (baseProps.redirectHandler) {
        redirectHandlers(lambdaFunction, baseProps.addLayers, useExtension);
      }

      if (this.props.forwarderArn !== undefined) {
        if (this.props.extensionLayerVersion !== undefined || this.props.extensionLayerArn !== undefined) {
          log.debug(`Skipping adding subscriptions to the lambda log groups since the extension is enabled`);
        } else {
          log.debug(`Adding log subscriptions using provided Forwarder ARN: ${this.props.forwarderArn}`);
          addForwarder(
            this.scope,
            lambdaFunction,
            this.props.forwarderArn,
            this.props.createForwarderPermissions === true,
          );
        }
      } else {
        log.debug("Forwarder ARN not provided, no log group subscriptions will be added");
      }

      addCdkConstructVersionTag(lambdaFunction);
      applyEnvVariables(lambdaFunction, baseProps);
      setDDEnvVariables(lambdaFunction, this.props);
      setTagsForFunction(lambdaFunction, this.props);

      this.transport.applyEnvVars(lambdaFunction);

      if (baseProps.sourceCodeIntegration) {
        this.addGitCommitMetadata([lambdaFunction]);
      }
      this.lambdas.push(lambdaFunction);
    }
  }

  public overrideGitMetadata(gitCommitSha: string, gitRepoUrl?: string): void {
    if (gitCommitSha) {
      this.gitCommitShaOverride = gitCommitSha;
    }
    if (gitRepoUrl) {
      this.gitRepoUrlOverride = gitRepoUrl;
    }

    // If any lambdas have already been added, override the commit sha and url
    if (this.lambdas) {
      this.lambdas.forEach((lambdaFunction: any) => {
        if (lambdaFunction.environment[DD_TAGS] === undefined) {
          return;
        }
        const tags = lambdaFunction.environment[DD_TAGS].value.split(",");
        if (gitCommitSha) {
          const index = tags.findIndex((val: string) => val.split(":")[0] === "git.commit.sha");
          tags[index] = `git.commit.sha:${gitCommitSha}`;
        }

        if (gitRepoUrl) {
          const index = tags.findIndex((val: string) => val.split(":")[0] === "git.repository_url");
          tags[index] = `git.repository_url:${gitRepoUrl}`;
        }

        lambdaFunction.environment[DD_TAGS].value = tags.join(",");
      });
    }
  }

  // unused parameters gitCommitSha and gitRepoUrl are kept for backwards compatibility
  public addGitCommitMetadata(
    lambdaFunctions: LambdaFunction[],
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    gitCommitSha?: string,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    gitRepoUrl?: string,
  ): void {
    const extractedLambdaFunctions = extractSingletonFunctions(lambdaFunctions);
    setGitEnvironmentVariables(extractedLambdaFunctions, this.gitCommitShaOverride, this.gitRepoUrlOverride);
  }

  public addForwarderToNonLambdaLogGroups(logGroups: logs.ILogGroup[]) {
    if (this.props.forwarderArn !== undefined) {
      addForwarderToLogGroups(
        this.scope,
        logGroups,
        this.props.forwarderArn,
        this.props.createForwarderPermissions === true,
      );
    } else {
      log.debug("Forwarder ARN not provided, no non lambda log group subscriptions will be added");
    }
  }
}

export function addCdkConstructVersionTag(lambdaFunction: lambda.Function): void {
  log.debug(`Adding CDK Construct version tag: ${versionJson.version}`);
  Tags.of(lambdaFunction).add(TagKeys.CDK, `v${versionJson.version}`, {
    includeResourceTypes: ["AWS::Lambda::Function"],
  });
}

function setTagsForFunction(lambdaFunction: lambda.Function, props: DatadogLambdaProps): void {
  if (props.forwarderArn) {
    setTags(lambdaFunction, props);
  }
}

function grantReadLambda(secret: ISecret, lambdaFunction: lambda.Function): void {
  secret.grantRead(lambdaFunction);
}

function grantReadLambdaFromSecretArn(construct: Construct, arn: string, lambdaFunction: lambda.Function): void {
  const secret = Secret.fromSecretPartialArn(construct, "DatadogApiKeySecret", arn);
  secret.grantRead(lambdaFunction);
}

function grantReadLambdaFromSsmParameterArn(arnOrName: string, lambdaFunction: lambda.Function): void {
  // Grant IAM permissions to support both String and SecureString SSM parameters
  // For SecureString parameters, the Datadog Extension will decrypt at runtime using KMS
  // Grant SSM read permissions
  lambdaFunction.addToRolePolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["ssm:GetParameter", "ssm:GetParameters"],
      resources: [arnOrName],
    }),
  );
  // Grant KMS decrypt permissions for SecureString parameters
  // By default, SSM uses the AWS managed key "alias/aws/ssm"
  // We also allow custom KMS keys in the same region/account
  const stack = Stack.of(lambdaFunction);
  lambdaFunction.addToRolePolicy(
    new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["kms:Decrypt"],
      resources: [
        `arn:aws:kms:${stack.region}:${stack.account}:alias/aws/ssm`,
        `arn:aws:kms:${stack.region}:${stack.account}:key/*`,
      ],
    }),
  );
}

function extractSingletonFunctions(lambdaFunctions: LambdaFunction[]): lambda.Function[] {
  // extract lambdaFunction property from Singleton Function
  // using bracket notation here since lambdaFunction is a private property
  const extractedLambdaFunctions: lambda.Function[] = lambdaFunctions.map((fn) => {
    // eslint-disable-next-line dot-notation
    return isSingletonFunction(fn) ? fn["lambdaFunction"] : fn;
  });

  return extractedLambdaFunctions;
}

function isSingletonFunction(fn: LambdaFunction): fn is lambda.SingletonFunction {
  return fn.hasOwnProperty("lambdaFunction");
}

export function validateProps(props: DatadogLambdaProps, apiKeyArnOverride = false): void {
  log.debug("Validating props...");

  checkForMultipleApiKeys(props, apiKeyArnOverride);
  if (
    props.site !== undefined &&
    !siteList.includes(props.site.toLowerCase()) &&
    !(props.site.startsWith("${Token[") && props.site.endsWith("]}")) &&
    !process.env.DD_CDK_BYPASS_SITE_VALIDATION
  ) {
    throw new Error(invalidSiteError);
  }

  if (
    props.apiKey === undefined &&
    props.apiKmsKey === undefined &&
    props.apiKeySecretArn === undefined &&
    props.apiKeySsmArn === undefined &&
    props.flushMetricsToLogs === false &&
    !apiKeyArnOverride
  ) {
    throw new Error(
      "When `flushMetricsToLogs` is false, `apiKey`, `apiKeySecretArn`, `apiKeySsmArn`, or `apiKmsKey` must also be set.",
    );
  }
  if (props.extensionLayerVersion !== undefined || props.extensionLayerArn !== undefined) {
    if (
      props.apiKey === undefined &&
      props.apiKeySecretArn === undefined &&
      props.apiKeySsmArn === undefined &&
      props.apiKmsKey === undefined &&
      !apiKeyArnOverride
    ) {
      throw new Error(
        "When `extensionLayerVersion` or `extensionLayerArn` is set, `apiKey`, `apiKeySecretArn`, `apiKeySsmArn`, or `apiKmsKey` must also be set.",
      );
    }
  }

  if (props.enableDatadogASM !== undefined) {
    log.warn("Warning: `enableDatadogASM` is deprecated, set `datadogAppSecMode` instead");
    if (props.datadogAppSecMode !== undefined) {
      throw new Error(
        "`datadogAppSecMode` and `enableDatadogASM` are mutually exclusive; set only `datadogAppSecMode`.",
      );
    }
  }

  if (
    props.datadogAppSecMode !== undefined &&
    !(Object.values(DatadogAppSecMode) as string[]).includes(props.datadogAppSecMode)
  ) {
    throw new Error("`datadogAppSecMode` must be one of: 'off', 'on', 'extension', 'tracer'.");
  }

  const appSecEnabled =
    props.enableDatadogASM ||
    (props.datadogAppSecMode &&
      ([DatadogAppSecMode.ON, DatadogAppSecMode.EXTENSION, DatadogAppSecMode.TRACER] as string[]).includes(
        props.datadogAppSecMode,
      ));
  if (
    (props.enableDatadogTracing === false && appSecEnabled) ||
    (props.extensionLayerVersion === undefined && props.extensionLayerArn === undefined && appSecEnabled)
  ) {
    throw new Error(
      "App and API Protection requires `enableDatadogTracing` and either `extensionLayerVersion` or `extensionLayerArn` when `datadogAppSecMode` or `enableDatadogASM` enable it.",
    );
  }

  if (props.llmObsEnabled === true && (props.llmObsMlApp === undefined || props.llmObsMlApp === "")) {
    throw new Error("When `llmObsEnabled` is true, `llmObsMlApp` must also be set.");
  }
  if (props.llmObsMlApp !== undefined && props.llmObsMlApp !== "") {
    const llmObsMlAppRegex = /^[a-zA-Z0-9_\-:\.\/]{1,193}$/;
    if (!llmObsMlAppRegex.test(props.llmObsMlApp)) {
      throw new Error(
        "`llmObsMlApp` must only contain up to 193 alphanumeric characters, hyphens, underscores, periods, and slashes.",
      );
    }
  }
}

export function checkForMultipleApiKeys(props: DatadogLambdaProps, apiKeyArnOverride = false): void {
  let multipleApiKeysMessage;
  const apiKeySecretArnOrOverride = props.apiKeySecretArn !== undefined || apiKeyArnOverride;
  const apiKeySsmArnDefined = props.apiKeySsmArn !== undefined;
  const sourcesCount = [
    props.apiKey !== undefined,
    props.apiKmsKey !== undefined,
    apiKeySecretArnOrOverride,
    apiKeySsmArnDefined,
  ].filter(Boolean).length;

  if (sourcesCount > 1) {
    const sources = [];
    if (props.apiKey !== undefined) sources.push("`apiKey`");
    if (props.apiKmsKey !== undefined) sources.push("`apiKmsKey`");
    if (apiKeySecretArnOrOverride) sources.push("`apiKeySecretArn`");
    if (apiKeySsmArnDefined) sources.push("`apiKeySsmArn`");

    multipleApiKeysMessage = sources.join(", ");
  }

  if (multipleApiKeysMessage) {
    throw new Error(`${multipleApiKeysMessage} should not be set at the same time.`);
  }
}

export function handleSettingPropDefaults(props: DatadogLambdaProps): DatadogLambdaStrictProps {
  let addLayers = props.addLayers;
  let enableDatadogTracing = props.enableDatadogTracing;
  let datadogAppSecMode: DatadogAppSecMode;
  let enableMergeXrayTraces = props.enableMergeXrayTraces;
  let injectLogContext = props.injectLogContext;
  const logLevel = props.logLevel;
  let enableDatadogLogs = props.enableDatadogLogs;
  let captureLambdaPayload = props.captureLambdaPayload;
  let captureCloudServicePayload = props.captureCloudServicePayload;
  let sourceCodeIntegration = props.sourceCodeIntegration;
  let redirectHandler = props.redirectHandler;
  let grantSecretReadAccess = props.grantSecretReadAccess;
  const extensionLayerVersion = props.extensionLayerVersion;
  const extensionLayerArn = props.extensionLayerArn;

  if (addLayers === undefined) {
    log.debug(`No value provided for addLayers, defaulting to ${DatadogLambdaDefaultProps.addLayers}`);
    addLayers = DatadogLambdaDefaultProps.addLayers;
  }
  if (enableDatadogTracing === undefined) {
    log.debug(
      `No value provided for enableDatadogTracing, defaulting to ${DatadogLambdaDefaultProps.enableDatadogTracing}`,
    );
    enableDatadogTracing = DatadogLambdaDefaultProps.enableDatadogTracing;
  }
  if (props.datadogAppSecMode === undefined) {
    if (props.enableDatadogASM) {
      datadogAppSecMode = DatadogAppSecMode.EXTENSION;
      log.debug("`enableDatadogASM` set, defaulting datadogAppSecMode to extension.");
    } else {
      log.debug(
        `No value provided for datadogAppSecMode, defaulting to ${DatadogLambdaDefaultProps.datadogAppSecMode}`,
      );
      datadogAppSecMode = DatadogLambdaDefaultProps.datadogAppSecMode;
    }
  } else {
    datadogAppSecMode = props.datadogAppSecMode as DatadogAppSecMode;
  }
  if (enableMergeXrayTraces === undefined) {
    log.debug(
      `No value provided for enableMergeXrayTraces, defaulting to ${DatadogLambdaDefaultProps.enableMergeXrayTraces}`,
    );
    enableMergeXrayTraces = DatadogLambdaDefaultProps.enableMergeXrayTraces;
  }
  if (injectLogContext === undefined) {
    log.debug(`No value provided for injectLogContext, defaulting to ${DatadogLambdaDefaultProps.injectLogContext}`);
    injectLogContext = DatadogLambdaDefaultProps.injectLogContext;
  }
  if (logLevel === undefined) {
    log.debug(`No value provided for logLevel`);
  }
  if (enableDatadogLogs === undefined) {
    log.debug(`No value provided for enableDatadogLogs, defaulting to ${DatadogLambdaDefaultProps.enableDatadogLogs}`);
    enableDatadogLogs = DatadogLambdaDefaultProps.enableDatadogLogs;
  }
  if (captureLambdaPayload === undefined) {
    log.debug(
      `No value provided for captureLambdaPayload, defaulting to ${DatadogLambdaDefaultProps.captureLambdaPayload}`,
    );
    captureLambdaPayload = DatadogLambdaDefaultProps.captureLambdaPayload;
  }
  if (captureCloudServicePayload === undefined) {
    log.debug(
      `No value provided for captureCloudServicePayload, default to ${DatadogLambdaDefaultProps.captureCloudServicePayload}`,
    );
    captureCloudServicePayload = DatadogLambdaDefaultProps.captureCloudServicePayload;
  }
  if (sourceCodeIntegration === undefined) {
    log.debug(
      `No value provided for sourceCodeIntegration, defaulting to ${DatadogLambdaDefaultProps.sourceCodeIntegration}`,
    );
    sourceCodeIntegration = DatadogLambdaDefaultProps.sourceCodeIntegration;
  }

  if (redirectHandler === undefined) {
    log.debug(`No value provided for redirectHandler, defaulting to ${DatadogLambdaDefaultProps.redirectHandler}`);
    redirectHandler = DatadogLambdaDefaultProps.redirectHandler;
  }

  if (grantSecretReadAccess === undefined) {
    log.debug(
      `No value provided for grantSecretReadAccess, defaulting to ${DatadogLambdaDefaultProps.grantSecretReadAccess}`,
    );
    grantSecretReadAccess = DatadogLambdaDefaultProps.grantSecretReadAccess;
  }

  return {
    addLayers: addLayers,
    enableDatadogTracing: enableDatadogTracing,
    datadogAppSecMode,
    enableMergeXrayTraces: enableMergeXrayTraces,
    injectLogContext: injectLogContext,
    logLevel: logLevel,
    enableDatadogLogs: enableDatadogLogs,
    captureLambdaPayload: captureLambdaPayload,
    captureCloudServicePayload: captureCloudServicePayload,
    sourceCodeIntegration: sourceCodeIntegration,
    redirectHandler: redirectHandler,
    grantSecretReadAccess: grantSecretReadAccess,
    extensionLayerVersion: extensionLayerVersion,
    extensionLayerArn: extensionLayerArn,
    pythonLayerVersion: props.pythonLayerVersion,
  };
}
