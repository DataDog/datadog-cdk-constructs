/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
export const DD_FLUSH_TO_LOG_ENV_VAR = "DD_FLUSH_TO_LOG";

export function applyEnvVariables(
    lambdas: lambda.Function[],
    flushMetricstoLogs: boolean,
  ) {
    lambdas.forEach((l) => {
      l.addEnvironment(DD_FLUSH_TO_LOG_ENV_VAR, flushMetricstoLogs.toString()
      )})
    }


