/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
import log from "loglevel";

export const ENABLE_DD_TRACING_ENV_VAR = "DD_TRACE_ENABLED";
export const INJECT_LOG_CONTEXT_ENV_VAR = "DD_LOGS_INJECTION";
export const LOG_LEVEL_ENV_VAR = "DD_LOG_LEVEL";
export const ENABLE_DD_LOGS_ENV_VAR = "DD_SERVERLESS_LOGS_ENABLED";

export function applyEnvVariables(
  lambdas: lambda.Function[],
  enableDatadogTracing: boolean,
  injectLogContext: boolean,
  enableDatadogLogs: boolean,
  logLevel?: string,
) {
  log.debug(`Setting environment variables...`);
  lambdas.forEach((lam) => {
    lam.addEnvironment(ENABLE_DD_TRACING_ENV_VAR, enableDatadogTracing.toString().toLowerCase());
    lam.addEnvironment(INJECT_LOG_CONTEXT_ENV_VAR, injectLogContext.toString().toLowerCase());
    lam.addEnvironment(ENABLE_DD_LOGS_ENV_VAR, enableDatadogLogs.toString().toLowerCase());
    if (logLevel) {
      lam.addEnvironment(LOG_LEVEL_ENV_VAR, logLevel);
    }
  });
}
