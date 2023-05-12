/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import log from "loglevel";
import { DefaultDatadogProps } from "./constants";
import { DatadogProps, DatadogStrictProps } from "./interfaces";

export function validateProps(props: DatadogProps) {
  log.debug("Validating props...");

  checkForMultipleApiKeys(props);
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
    !(props.site.startsWith("${Token[") && props.site.endsWith("]}"))
  ) {
    throw new Error(
      "Warning: Invalid site URL. Must be either datadoghq.com, datadoghq.eu, us3.datadoghq.com, us5.datadoghq.com, ap1.datadoghq.com, or ddog-gov.com.",
    );
  }

  if (
    props.apiKey === undefined &&
    props.apiKmsKey === undefined &&
    props.apiKeySecretArn === undefined &&
    props.flushMetricsToLogs === false
  ) {
    throw new Error(
      "When `flushMetricsToLogs` is false, `apiKey`, `apiKeySecretArn`, or `apiKmsKey` must also be set.",
    );
  }
  if (props.extensionLayerVersion !== undefined) {
    if (props.apiKey === undefined && props.apiKeySecretArn === undefined && props.apiKmsKey === undefined) {
      throw new Error("When `extensionLayer` is set, `apiKey`, `apiKeySecretArn`, or `apiKmsKey` must also be set.");
    }
  }
}

export function checkForMultipleApiKeys(props: DatadogProps) {
  let multipleApiKeysMessage;
  if (props.apiKey !== undefined && props.apiKmsKey !== undefined && props.apiKeySecretArn !== undefined) {
    multipleApiKeysMessage = "`apiKey`, `apiKmsKey`, and `apiKeySecretArn`";
  } else if (props.apiKey !== undefined && props.apiKmsKey !== undefined) {
    multipleApiKeysMessage = "`apiKey` and `apiKmsKey`";
  } else if (props.apiKey !== undefined && props.apiKeySecretArn !== undefined) {
    multipleApiKeysMessage = "`apiKey` and `apiKeySecretArn`";
  } else if (props.apiKmsKey !== undefined && props.apiKeySecretArn !== undefined) {
    multipleApiKeysMessage = "`apiKmsKey` and `apiKeySecretArn`";
  }

  if (multipleApiKeysMessage) {
    throw new Error(`${multipleApiKeysMessage} should not be set at the same time.`);
  }
}

export function handleSettingPropDefaults(props: DatadogProps): DatadogStrictProps {
  let addLayers = props.addLayers;
  let enableDatadogTracing = props.enableDatadogTracing;
  let enableMergeXrayTraces = props.enableMergeXrayTraces;
  let injectLogContext = props.injectLogContext;
  const logLevel = props.logLevel;
  let enableDatadogLogs = props.enableDatadogLogs;
  let captureLambdaPayload = props.captureLambdaPayload;
  let sourceCodeIntegration = props.sourceCodeIntegration;

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

  return {
    addLayers: addLayers,
    enableDatadogTracing: enableDatadogTracing,
    enableMergeXrayTraces: enableMergeXrayTraces,
    injectLogContext: injectLogContext,
    logLevel: logLevel,
    enableDatadogLogs: enableDatadogLogs,
    captureLambdaPayload: captureLambdaPayload,
    sourceCodeIntegration: sourceCodeIntegration,
  };
}
