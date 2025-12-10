/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { DatadogAppSecMode } from "./interfaces";

export const LAYER_PREFIX = "DatadogLayer";
export const EXTENSION_LAYER_PREFIX = "DatadogExtension";
export const DD_ACCOUNT_ID = "464622532012";
export const DD_GOV_ACCOUNT_ID = "002406178527";
export const DD_HANDLER_ENV_VAR = "DD_LAMBDA_HANDLER";
export const AWS_LAMBDA_EXEC_WRAPPER_ENV_VAR = "AWS_LAMBDA_EXEC_WRAPPER";
export const AWS_LAMBDA_EXEC_WRAPPER = "/opt/datadog_wrapper";
export const PYTHON_HANDLER = "datadog_lambda.handler.handler";
export const JS_HANDLER_WITH_LAYERS = "/opt/nodejs/node_modules/datadog-lambda-js/handler.handler";
export const JS_HANDLER = "node_modules/datadog-lambda-js/dist/handler.handler";
export const SUBSCRIPTION_FILTER_PREFIX = "DatadogSubscriptionFilter";

export enum RuntimeType {
  DOTNET,
  NODE,
  PYTHON,
  JAVA,
  RUBY,
  CUSTOM,
  UNSUPPORTED,
}

export const DatadogLambdaDefaultProps = {
  addLayers: true,
  enableDatadogTracing: true,
  datadogAppSecMode: DatadogAppSecMode.OFF,
  enableMergeXrayTraces: false,
  injectLogContext: true,
  enableDatadogLogs: true,
  captureLambdaPayload: false,
  captureCloudServicePayload: false,
  sourceCodeIntegration: true,
  redirectHandler: true,
  grantSecretReadAccess: true,
};

/**
 * For backward compatibility. It's recommended to use DatadogLambdaDefaultProps for
 * users who want to add Datadog monitoring for Lambda functions.
 */
export const DatadogDefaultProps = DatadogLambdaDefaultProps;

export enum TagKeys {
  CDK = "dd_cdk_construct",
  ENV = "env",
  SERVICE = "service",
  VERSION = "version",
  DD_TRACE_ENABLED = "DD_TRACE_ENABLED",
}

export const runtimeLookup: { [key: string]: RuntimeType } = {
  "dotnet6": RuntimeType.DOTNET,
  "dotnet8": RuntimeType.DOTNET,
  "nodejs12.x": RuntimeType.NODE,
  "nodejs14.x": RuntimeType.NODE,
  "nodejs16.x": RuntimeType.NODE,
  "nodejs18.x": RuntimeType.NODE,
  "nodejs20.x": RuntimeType.NODE,
  "nodejs22.x": RuntimeType.NODE,
  "nodejs24.x": RuntimeType.NODE,
  "python3.6": RuntimeType.PYTHON,
  "python3.7": RuntimeType.PYTHON,
  "python3.8": RuntimeType.PYTHON,
  "python3.9": RuntimeType.PYTHON,
  "python3.10": RuntimeType.PYTHON,
  "python3.11": RuntimeType.PYTHON,
  "python3.12": RuntimeType.PYTHON,
  "python3.13": RuntimeType.PYTHON,
  "python3.14": RuntimeType.PYTHON,
  "java8.al2": RuntimeType.JAVA,
  "java11": RuntimeType.JAVA,
  "java17": RuntimeType.JAVA,
  "java21": RuntimeType.JAVA,
  "java25": RuntimeType.JAVA,
  "provided": RuntimeType.CUSTOM,
  "provided.al2": RuntimeType.CUSTOM,
  "provided.al2023": RuntimeType.CUSTOM,
  "ruby3.2": RuntimeType.RUBY,
  "ruby3.3": RuntimeType.RUBY,
  "ruby3.4": RuntimeType.RUBY,
};

export const runtimeToLayerName: { [key: string]: string } = {
  "dotnet6": "dd-trace-dotnet",
  "dotnet8": "dd-trace-dotnet",
  "nodejs12.x": "Datadog-Node12-x",
  "nodejs14.x": "Datadog-Node14-x",
  "nodejs16.x": "Datadog-Node16-x",
  "nodejs18.x": "Datadog-Node18-x",
  "nodejs20.x": "Datadog-Node20-x",
  "nodejs22.x": "Datadog-Node22-x",
  "nodejs24.x": "Datadog-Node24-x",
  "python3.6": "Datadog-Python36",
  "python3.7": "Datadog-Python37",
  "python3.8": "Datadog-Python38",
  "python3.9": "Datadog-Python39",
  "python3.10": "Datadog-Python310",
  "python3.11": "Datadog-Python311",
  "python3.12": "Datadog-Python312",
  "python3.13": "Datadog-Python313",
  "python3.14": "Datadog-Python314",
  "java8.al2": "dd-trace-java",
  "java11": "dd-trace-java",
  "java17": "dd-trace-java",
  "java21": "dd-trace-java",
  "java25": "dd-trace-java",
  "ruby32": "Datadog-Ruby3-2",
  "ruby33": "Datadog-Ruby3-3",
  "ruby34": "Datadog-Ruby3-4",
};

export const govCloudRegions: ReadonlyArray<string> = ["us-gov-east-1", "us-gov-west-1"];

/**
 * Valid Datadog site URLs
 */
export const siteList: string[] = [
  "datadoghq.com",
  "datadoghq.eu",
  "us3.datadoghq.com",
  "us5.datadoghq.com",
  "ap1.datadoghq.com",
  "ap2.datadoghq.com",
  "ddog-gov.com",
];

export const invalidSiteError = `Warning: Invalid site URL. Must be one of: ${siteList.join(", ")}.`;
