/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

/*
 * This file used to be in v1/src, was moved to common by using the ILambdaFunction interface
 * in place of importing Function from @aws-cdk/aws-lambda
 */


import log from "loglevel";
import { ILambdaFunction, DatadogStrictProps } from "./interfaces";

export const ENABLE_DD_TRACING_ENV_VAR = "DD_TRACE_ENABLED";
export const INJECT_LOG_CONTEXT_ENV_VAR = "DD_LOGS_INJECTION";
export const LOG_LEVEL_ENV_VAR = "DD_LOG_LEVEL";
export const ENABLE_DD_LOGS_ENV_VAR = "DD_SERVERLESS_LOGS_ENABLED";
export const CAPTURE_LAMBDA_PAYLOAD_ENV_VAR = "DD_CAPTURE_LAMBDA_PAYLOAD";

/*
 * This function's parameter/return type changed.
 *
 * ILambdaFunction is used instead of a AWS import
 * DatadogStrictProps is used to contain the properties:
 *    - enableDatadogTracing, 
 *    - injectLogContext, 
 *    - enableDatadogLogs,
 *    - captureLambdaPayload
 * that were previously passed directly into the function
 */
export function applyEnvVariables(lambdas: ILambdaFunction[], baseProps: DatadogStrictProps) {
  log.debug(`Setting environment variables...`);
  lambdas.forEach((lam) => {
    lam.addEnvironment(ENABLE_DD_TRACING_ENV_VAR, baseProps.enableDatadogTracing.toString().toLowerCase());
    lam.addEnvironment(INJECT_LOG_CONTEXT_ENV_VAR, baseProps.injectLogContext.toString().toLowerCase());
    lam.addEnvironment(ENABLE_DD_LOGS_ENV_VAR, baseProps.enableDatadogLogs.toString().toLowerCase());
    lam.addEnvironment(CAPTURE_LAMBDA_PAYLOAD_ENV_VAR, baseProps.captureLambdaPayload.toString().toLowerCase());
    if (baseProps.logLevel) {
      lam.addEnvironment(LOG_LEVEL_ENV_VAR, baseProps.logLevel);
    }
  });
}
