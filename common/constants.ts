/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

export const LAYER_PREFIX = "DatadogLayer";
export const EXTENSION_LAYER_PREFIX = "DatadogExtension";
export const DD_ACCOUNT_ID = "464622532012";
export const DD_GOV_ACCOUNT_ID = "002406178527";
export const DD_HANDLER_ENV_VAR = "DD_LAMBDA_HANDLER";
export const PYTHON_HANDLER = "datadog_lambda.handler.handler";
export const JS_HANDLER_WITH_LAYERS = "/opt/nodejs/node_modules/datadog-lambda-js/handler.handler";
export const JS_HANDLER = "node_modules/datadog-lambda-js/dist/handler.handler";
export const SUBSCRIPTION_FILTER_PREFIX = "DatadogSubscriptionFilter";

export enum RuntimeType {
  NODE,
  PYTHON,
  UNSUPPORTED,
}

export const DefaultDatadogProps = {
  addLayers: true,
  enableDatadogTracing: true,
  enableMergeXrayTraces: false,
  injectLogContext: true,
  enableDatadogLogs: true,
  architecture: "X86_64",
  captureLambdaPayload: false,
};

export enum TagKeys {
  CDK = "dd_cdk_construct",
  ENV = "env",
  SERVICE = "service",
  VERSION = "version",
}

export const runtimeLookup: { [key: string]: RuntimeType } = {
  "nodejs12.x": RuntimeType.NODE,
  "nodejs14.x": RuntimeType.NODE,
  "nodejs16.x": RuntimeType.NODE,
  "nodejs18.x": RuntimeType.NODE,
  "python3.6": RuntimeType.PYTHON,
  "python3.7": RuntimeType.PYTHON,
  "python3.8": RuntimeType.PYTHON,
  "python3.9": RuntimeType.PYTHON,
};

export const runtimeToLayerName: { [key: string]: string } = {
  "nodejs12.x": "Datadog-Node12-x",
  "nodejs14.x": "Datadog-Node14-x",
  "nodejs16.x": "Datadog-Node16-x",
  "nodejs18.x": "Datadog-Node18-x",
  "python3.6": "Datadog-Python36",
  "python3.7": "Datadog-Python37",
  "python3.8": "Datadog-Python38",
  "python3.9": "Datadog-Python39",
};

export const govCloudRegions: ReadonlyArray<string> = ["us-gov-east-1", "us-gov-west-1"];
