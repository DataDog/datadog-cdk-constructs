/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import log from "loglevel";
import { LambdaFunction } from "../index";

export const ENABLE_DD_TRACING_ENV_VAR = "DD_TRACE_ENABLED";
export const INJECT_LOG_CONTEXT_ENV_VAR = "DD_LOGS_INJECTION";
export const LOG_LEVEL_ENV_VAR = "DD_LOG_LEVEL";
export const ENABLE_DD_LOGS_ENV_VAR = "DD_SERVERLESS_LOGS_ENABLED";
export const CAPTURE_LAMBDA_PAYLOAD_ENV_VAR = "DD_CAPTURE_LAMBDA_PAYLOAD";

export function applyEnvVariables(
  lambdas: LambdaFunction[],
  enableDatadogTracing: boolean,
  injectLogContext: boolean,
  enableDatadogLogs: boolean,
  captureLambdaPayload: boolean,
  logLevel?: string,
) {
  log.debug(`Setting environment variables...`);
  lambdas.forEach((lam) => {
    lam.addEnvironment(ENABLE_DD_TRACING_ENV_VAR, enableDatadogTracing.toString().toLowerCase());
    lam.addEnvironment(INJECT_LOG_CONTEXT_ENV_VAR, injectLogContext.toString().toLowerCase());
    lam.addEnvironment(ENABLE_DD_LOGS_ENV_VAR, enableDatadogLogs.toString().toLowerCase());
    lam.addEnvironment(CAPTURE_LAMBDA_PAYLOAD_ENV_VAR, captureLambdaPayload.toString().toLowerCase());
    if (logLevel) {
      lam.addEnvironment(LOG_LEVEL_ENV_VAR, logLevel);
    }
  });
}
