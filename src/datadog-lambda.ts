/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { Tags } from "aws-cdk-lib";
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
  DatadogStrictProps,
  setGitEnvironmentVariables,
  setDDEnvVariables,
  DefaultDatadogProps,
  DatadogProps,
  Transport,
  applyExtensionLayer,
} from "./index";
import { LambdaFunction } from "./interfaces";

const versionJson = require("../version.json");

export class DatadogLambda extends Construct {
  scope: Construct;
  props: DatadogProps;
  transport: Transport;
  constructor(scope: Construct, id: string, props: DatadogProps) {
    if (process.env.DD_CONSTRUCT_DEBUG_LOGS?.toLowerCase() == "true") {
      log.setLevel("debug");
    }
    super(scope, id);
    this.scope = scope;
    this.props = props;
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
      this.props.apiKmsKey,
      this.props.extensionLayerVersion,
    );
  }

  public addLambdaFunctions(lambdaFunctions: LambdaFunction[], construct?: Construct): void {
    // baseProps contains all properties set by the user, with default values for properties
    // defined in DefaultDatadogProps (if not set by user)
    const baseProps: DatadogStrictProps = handleSettingPropDefaults(this.props);

    const extractedLambdaFunctions = extractSingletonFunctions(lambdaFunctions);

    if (extractedLambdaFunctions.length === 0) {
      return;
    }

    if (this.props.apiKeySecret !== undefined) {
      grantReadLambdas(this.props.apiKeySecret, extractedLambdaFunctions);
    } else if (this.props.apiKeySecretArn !== undefined && construct !== undefined && baseProps.grantSecretReadAccess) {
      log.debug("Granting read access to the provided Secret ARN for all your lambda functions.");
      grantReadLambdasFromSecretArn(construct, this.props.apiKeySecretArn, extractedLambdaFunctions);
    }

    const region = extractedLambdaFunctions[0].env.region;
    log.debug(`Using region: ${region}`);
    if (baseProps.addLayers) {
      applyLayers(
        this.scope,
        region,
        extractedLambdaFunctions,
        this.props.pythonLayerVersion,
        this.props.nodeLayerVersion,
        this.props.javaLayerVersion,
        this.props.dotnetLayerVersion,
        this.props.useLayersFromAccount,
      );
    }

    if (baseProps.extensionLayerVersion !== undefined) {
      applyExtensionLayer(
        this.scope,
        region,
        extractedLambdaFunctions,
        baseProps.extensionLayerVersion,
        this.props.useLayersFromAccount,
      );
    }

    if (baseProps.redirectHandler) {
      redirectHandlers(extractedLambdaFunctions, baseProps.addLayers);
    }

    if (this.props.forwarderArn !== undefined) {
      if (this.props.extensionLayerVersion !== undefined) {
        log.debug(`Skipping adding subscriptions to the lambda log groups since the extension is enabled`);
      } else {
        log.debug(`Adding log subscriptions using provided Forwarder ARN: ${this.props.forwarderArn}`);
        addForwarder(
          this.scope,
          extractedLambdaFunctions,
          this.props.forwarderArn,
          this.props.createForwarderPermissions === true,
        );
      }
    } else {
      log.debug("Forwarder ARN not provided, no log group subscriptions will be added");
    }

    addCdkConstructVersionTag(extractedLambdaFunctions);

    applyEnvVariables(extractedLambdaFunctions, baseProps);
    setDDEnvVariables(extractedLambdaFunctions, this.props);
    setTags(extractedLambdaFunctions, this.props);

    this.transport.applyEnvVars(extractedLambdaFunctions);

    if (baseProps.sourceCodeIntegration) {
      this.addGitCommitMetadata(extractedLambdaFunctions);
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
    setGitEnvironmentVariables(extractedLambdaFunctions);
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

export function addCdkConstructVersionTag(lambdaFunctions: lambda.Function[]): void {
  log.debug(`Adding CDK Construct version tag: ${versionJson.version}`);
  lambdaFunctions.forEach((functionName) => {
    Tags.of(functionName).add(TagKeys.CDK, `v${versionJson.version}`, {
      includeResourceTypes: ["AWS::Lambda::Function"],
    });
  });
}

function setTags(lambdaFunctions: lambda.Function[], props: DatadogProps): void {
  log.debug(`Adding datadog tags`);
  lambdaFunctions.forEach((functionName) => {
    if (props.forwarderArn) {
      if (props.env) {
        Tags.of(functionName).add(TagKeys.ENV, props.env);
      }
      if (props.service) {
        Tags.of(functionName).add(TagKeys.SERVICE, props.service);
      }
      if (props.version) {
        Tags.of(functionName).add(TagKeys.VERSION, props.version);
      }
      if (props.tags) {
        const tagsArray = props.tags.split(",");
        tagsArray.forEach((tag: string) => {
          const [key, value] = tag.split(":");
          if (key && value) {
            Tags.of(functionName).add(key, value);
          }
        });
      }
    }
  });
}

function grantReadLambdas(secret: ISecret, lambdaFunctions: lambda.Function[]): void {
  lambdaFunctions.forEach((functionName) => {
    secret.grantRead(functionName);
  });
}

function grantReadLambdasFromSecretArn(construct: Construct, arn: string, lambdaFunctions: lambda.Function[]): void {
  const secret = Secret.fromSecretPartialArn(construct, "DatadogApiKeySecret", arn);
  lambdaFunctions.forEach((functionName) => {
    secret.grantRead(functionName);
  });
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

export function validateProps(props: DatadogProps, apiKeyArnOverride = false): void {
  log.debug("Validating props...");

  checkForMultipleApiKeys(props, apiKeyArnOverride);
  const siteList: string[] = [
    "datadoghq.com",
    "datadoghq.eu",
    "us3.datadoghq.com",
    "us5.datadoghq.com",
    "ap1.datadoghq.com",
    "ddog-gov.com",
  ];
  if (
    props.site !== undefined &&
    !siteList.includes(props.site.toLowerCase()) &&
    !(props.site.startsWith("${Token[") && props.site.endsWith("]}")) &&
    !process.env.DD_CDK_BYPASS_SITE_VALIDATION
  ) {
    throw new Error(
      "Warning: Invalid site URL. Must be either datadoghq.com, datadoghq.eu, us3.datadoghq.com, us5.datadoghq.com, ap1.datadoghq.com, or ddog-gov.com.",
    );
  }

  if (
    props.apiKey === undefined &&
    props.apiKmsKey === undefined &&
    props.apiKeySecretArn === undefined &&
    props.flushMetricsToLogs === false &&
    !apiKeyArnOverride
  ) {
    throw new Error(
      "When `flushMetricsToLogs` is false, `apiKey`, `apiKeySecretArn`, or `apiKmsKey` must also be set.",
    );
  }
  if (props.extensionLayerVersion !== undefined) {
    if (
      props.apiKey === undefined &&
      props.apiKeySecretArn === undefined &&
      props.apiKmsKey === undefined &&
      !apiKeyArnOverride
    ) {
      throw new Error("When `extensionLayer` is set, `apiKey`, `apiKeySecretArn`, or `apiKmsKey` must also be set.");
    }
  }
  if (
    (props.enableDatadogTracing === false && props.enableDatadogASM) ||
    (props.extensionLayerVersion == undefined && props.enableDatadogASM)
  ) {
    throw new Error(
      "When `enableDatadogASM` is enabled, `enableDatadogTracing` and `extensionLayerVersion` must also be enabled.",
    );
  }
}

export function checkForMultipleApiKeys(props: DatadogProps, apiKeyArnOverride = false): void {
  let multipleApiKeysMessage;
  const apiKeyArnOrOverride = props.apiKeySecretArn !== undefined || apiKeyArnOverride;
  if (props.apiKey !== undefined && props.apiKmsKey !== undefined && apiKeyArnOrOverride) {
    multipleApiKeysMessage = "`apiKey`, `apiKmsKey`, and `apiKeySecretArn`";
  } else if (props.apiKey !== undefined && props.apiKmsKey !== undefined) {
    multipleApiKeysMessage = "`apiKey` and `apiKmsKey`";
  } else if (props.apiKey !== undefined && apiKeyArnOrOverride) {
    multipleApiKeysMessage = "`apiKey` and `apiKeySecretArn`";
  } else if (props.apiKmsKey !== undefined && apiKeyArnOrOverride) {
    multipleApiKeysMessage = "`apiKmsKey` and `apiKeySecretArn`";
  }

  if (multipleApiKeysMessage) {
    throw new Error(`${multipleApiKeysMessage} should not be set at the same time.`);
  }
}

export function handleSettingPropDefaults(props: DatadogProps): DatadogStrictProps {
  let addLayers = props.addLayers;
  let enableDatadogTracing = props.enableDatadogTracing;
  let enableDatadogASM = props.enableDatadogASM;
  let enableMergeXrayTraces = props.enableMergeXrayTraces;
  let injectLogContext = props.injectLogContext;
  const logLevel = props.logLevel;
  let enableDatadogLogs = props.enableDatadogLogs;
  let captureLambdaPayload = props.captureLambdaPayload;
  let sourceCodeIntegration = props.sourceCodeIntegration;
  let redirectHandler = props.redirectHandler;
  let grantSecretReadAccess = props.grantSecretReadAccess;
  const extensionLayerVersion = props.extensionLayerVersion;

  if (addLayers === undefined) {
    log.debug(`No value provided for addLayers, defaulting to ${DefaultDatadogProps.addLayers}`);
    addLayers = DefaultDatadogProps.addLayers;
  }
  if (enableDatadogTracing === undefined) {
    log.debug(`No value provided for enableDatadogTracing, defaulting to ${DefaultDatadogProps.enableDatadogTracing}`);
    enableDatadogTracing = DefaultDatadogProps.enableDatadogTracing;
  }
  if (enableDatadogASM === undefined) {
    log.debug(`No value provided for enableDatadogASM, defaulting to ${DefaultDatadogProps.enableDatadogASM}`);
    enableDatadogASM = DefaultDatadogProps.enableDatadogASM;
  }
  if (enableMergeXrayTraces === undefined) {
    log.debug(
      `No value provided for enableMergeXrayTraces, defaulting to ${DefaultDatadogProps.enableMergeXrayTraces}`,
    );
    enableMergeXrayTraces = DefaultDatadogProps.enableMergeXrayTraces;
  }
  if (injectLogContext === undefined) {
    log.debug(`No value provided for injectLogContext, defaulting to ${DefaultDatadogProps.injectLogContext}`);
    injectLogContext = DefaultDatadogProps.injectLogContext;
  }
  if (logLevel === undefined) {
    log.debug(`No value provided for logLevel`);
  }
  if (enableDatadogLogs === undefined) {
    log.debug(`No value provided for enableDatadogLogs, defaulting to ${DefaultDatadogProps.enableDatadogLogs}`);
    enableDatadogLogs = DefaultDatadogProps.enableDatadogLogs;
  }
  if (captureLambdaPayload === undefined) {
    log.debug(`No value provided for captureLambdaPayload, default to ${DefaultDatadogProps.captureLambdaPayload}`);
    captureLambdaPayload = DefaultDatadogProps.captureLambdaPayload;
  }
  if (sourceCodeIntegration === undefined) {
    log.debug(`No value provided for sourceCodeIntegration, default to ${DefaultDatadogProps.sourceCodeIntegration}`);
    sourceCodeIntegration = DefaultDatadogProps.sourceCodeIntegration;
  }

  if (redirectHandler === undefined) {
    log.debug(`No value provided for redirectHandler, default to ${DefaultDatadogProps.redirectHandler}`);
    redirectHandler = DefaultDatadogProps.redirectHandler;
  }

  if (grantSecretReadAccess === undefined) {
    log.debug(`No value provided for grantSecretReadAccess, default to ${DefaultDatadogProps.grantSecretReadAccess}`);
    grantSecretReadAccess = DefaultDatadogProps.grantSecretReadAccess;
  }

  return {
    addLayers: addLayers,
    enableDatadogTracing: enableDatadogTracing,
    enableDatadogASM,
    enableMergeXrayTraces: enableMergeXrayTraces,
    injectLogContext: injectLogContext,
    logLevel: logLevel,
    enableDatadogLogs: enableDatadogLogs,
    captureLambdaPayload: captureLambdaPayload,
    sourceCodeIntegration: sourceCodeIntegration,
    redirectHandler: redirectHandler,
    grantSecretReadAccess: grantSecretReadAccess,
    extensionLayerVersion: extensionLayerVersion,
  };
}
