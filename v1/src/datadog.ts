/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdaNodejs from "@aws-cdk/aws-lambda-nodejs";
import * as lambdaPython from "@aws-cdk/aws-lambda-python";
import * as logs from "@aws-cdk/aws-logs";
import * as cdk from "@aws-cdk/core";
import log from "loglevel";
import {
  addForwarder,
  addForwarderToLogGroups,
  applyEnvVariables,
  applyLayers,
  DatadogProps,
  DatadogStrictProps,
  DefaultDatadogProps,
  redirectHandlers,
  setDDEnvVariables,
  setGitEnvironmentVariables,
  TagKeys,
  Transport,
} from "./index";

const versionJson = require("../version.json");

export class Datadog extends cdk.Construct {
  scope: cdk.Construct;
  props: DatadogProps;
  transport: Transport;
  constructor(scope: cdk.Construct, id: string, props: DatadogProps) {
    if (process.env.DD_CONSTRUCT_DEBUG_LOGS?.toLowerCase() == "true") {
      log.setLevel("debug");
    }
    super(scope, id);
    this.scope = scope;
    this.props = props;
    validateProps(this.props);
    this.transport = new Transport(
      this.props.flushMetricsToLogs,
      this.props.site,
      this.props.apiKey,
      this.props.apiKeySecretArn,
      this.props.apiKmsKey,
      this.props.extensionLayerVersion,
    );
  }

  public addLambdaFunctions(
    lambdaFunctions: (lambda.Function | lambdaNodejs.NodejsFunction | lambdaPython.PythonFunction)[],
  ) {
    const baseProps: DatadogStrictProps = handleSettingPropDefaults(this.props);

    if (this.props !== undefined && lambdaFunctions.length > 0) {
      const region = `${lambdaFunctions[0].env.region}`;
      log.debug(`Using region: ${region}`);
      if (baseProps.addLayers) {
        applyLayers(
          this.scope,
          region,
          lambdaFunctions,
          this.props.pythonLayerVersion,
          this.props.nodeLayerVersion,
          this.props.javaLayerVersion,
          this.props.extensionLayerVersion,
          this.props.useLayersFromAccount,
        );
      }

      if (baseProps.redirectHandler) {
        redirectHandlers(lambdaFunctions, baseProps.addLayers);
      }

      if (this.props.forwarderArn !== undefined) {
        if (this.props.extensionLayerVersion !== undefined) {
          log.debug(`Skipping adding subscriptions to the lambda log groups since the extension is enabled`);
        } else {
          log.debug(`Adding log subscriptions using provided Forwarder ARN: ${this.props.forwarderArn}`);
          addForwarder(this.scope, lambdaFunctions, this.props.forwarderArn);
        }
      } else {
        log.debug("Forwarder ARN not provided, no log group subscriptions will be added");
      }

      addCdkConstructVersionTag(lambdaFunctions);

      applyEnvVariables(lambdaFunctions, baseProps);
      setDDEnvVariables(lambdaFunctions, this.props);
      setTags(lambdaFunctions, this.props);

      this.transport.applyEnvVars(lambdaFunctions);

      if (baseProps.sourceCodeIntegration) {
        this.addGitCommitMetadata(lambdaFunctions);
      }
    }
  }

  // unused parameters gitCommitSha and gitRepoUrl are kept for backwards compatibility
  public addGitCommitMetadata(
    lambdaFunctions: (lambda.Function | lambdaNodejs.NodejsFunction | lambdaPython.PythonFunction)[],
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    gitCommitSha?: string,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    gitRepoUrl?: string,
  ) {
    setGitEnvironmentVariables(lambdaFunctions);
  }

  public addForwarderToNonLambdaLogGroups(logGroups: logs.ILogGroup[]) {
    if (this.props.forwarderArn !== undefined) {
      addForwarderToLogGroups(this.scope, logGroups, this.props.forwarderArn);
    } else {
      log.debug("Forwarder ARN not provided, no non lambda log group subscriptions will be added");
    }
  }
}

export function addCdkConstructVersionTag(lambdaFunctions: lambda.Function[]) {
  log.debug(`Adding CDK Construct version tag: ${versionJson.version}`);
  lambdaFunctions.forEach((functionName) => {
    cdk.Tags.of(functionName).add(TagKeys.CDK, `v${versionJson.version}`, {
      includeResourceTypes: ["AWS::Lambda::Function"],
    });
  });
}

function setTags(lambdaFunctions: lambda.Function[], props: DatadogProps) {
  log.debug(`Adding datadog tags`);
  lambdaFunctions.forEach((functionName) => {
    if (props.forwarderArn) {
      if (props.env) {
        cdk.Tags.of(functionName).add(TagKeys.ENV, props.env);
      }
      if (props.service) {
        cdk.Tags.of(functionName).add(TagKeys.SERVICE, props.service);
      }
      if (props.version) {
        cdk.Tags.of(functionName).add(TagKeys.VERSION, props.version);
      }
      if (props.tags) {
        const tagsArray = props.tags.split(",");
        tagsArray.forEach((tag: string) => {
          const [key, value] = tag.split(":");
          if (key && value) {
            cdk.Tags.of(functionName).add(key, value);
          }
        });
      }
    }
  });
}

function validateProps(props: DatadogProps, apiKeyArnOverride = false) {
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
}

export function checkForMultipleApiKeys(props: DatadogProps, apiKeyArnOverride = false) {
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

function handleSettingPropDefaults(props: DatadogProps): DatadogStrictProps {
  let addLayers = props.addLayers;
  let enableDatadogTracing = props.enableDatadogTracing;
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
