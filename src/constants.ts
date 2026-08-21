/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import { DatadogAppSecMode } from "./interfaces";
import { lambdaLayerCatalog } from "./lambda-layer-catalog";

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

const runtimeTypeLookup: { [key: string]: RuntimeType } = {
  DOTNET: RuntimeType.DOTNET,
  NODE: RuntimeType.NODE,
  PYTHON: RuntimeType.PYTHON,
  JAVA: RuntimeType.JAVA,
  RUBY: RuntimeType.RUBY,
  CUSTOM: RuntimeType.CUSTOM,
  UNSUPPORTED: RuntimeType.UNSUPPORTED,
};

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

export const runtimeLookup: { [key: string]: RuntimeType } = Object.fromEntries(
  lambdaLayerCatalog.runtimes.flatMap((runtime) =>
    "runtimeType" in runtime ? [[runtime.runtime, runtimeTypeLookup[runtime.runtimeType]]] : [],
  ),
);

export const runtimeToLayerName: { [key: string]: string } = Object.fromEntries(
  lambdaLayerCatalog.runtimes.flatMap((runtime) =>
    "layerName" in runtime ? [[runtime.runtime, runtime.layerName]] : [],
  ),
);

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
  "uk1.datadoghq.com",
  "ddog-gov.com",
  "us2.ddog-gov.com",
];

export const invalidSiteError = `Warning: Invalid site URL. Must be one of: ${siteList.join(", ")}.`;
