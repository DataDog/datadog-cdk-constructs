/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";

export const enableDDTracingEnvVar = "DD_TRACE_ENABLED";
export const injectLogContextEnvVar = "DD_LOG_INJECTION";

export const defaultEnvVar = {
  addLayers: true,
  enableDDTracing: true,
  injectLogContext: true,
};

export function applyEnvVariables(lambdas: lambda.Function[], enableDDTracing: boolean, injectLogContext: boolean) {
  lambdas.forEach((lam) => {
    lam.addEnvironment(enableDDTracingEnvVar, enableDDTracing.toString().toLowerCase());
    lam.addEnvironment(injectLogContextEnvVar, injectLogContext.toString().toLowerCase());
  });
}
