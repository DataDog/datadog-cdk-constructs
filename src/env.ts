/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
import log from "loglevel";

export const enableDDTracingEnvVar = "DD_TRACE_ENABLED";
export const injectLogContextEnvVar = "DD_LOGS_INJECTION";

export const defaultEnvVar = {
  addLayers: true,
  enableDatadogTracing: true,
  injectLogContext: true,
};

export function applyEnvVariables(
  lambdas: lambda.Function[],
  enableDatadogTracing: boolean,
  injectLogContext: boolean,
) {
  log.debug(`Setting tracing environment variables...`);
  lambdas.forEach((lam) => {
    lam.addEnvironment(enableDDTracingEnvVar, enableDatadogTracing.toString().toLowerCase());
    lam.addEnvironment(injectLogContextEnvVar, injectLogContext.toString().toLowerCase());
  });
}
