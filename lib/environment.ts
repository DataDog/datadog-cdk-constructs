/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
export const DD_FLUSH_TO_LOG = "DD_FLUSH_TO_LOG";
export const DD_SITE = "DD_SITE"

export function applyEnvVariables(
    lambdas: lambda.Function[],
    flushMetricstoLogs: boolean,
    site: string
  ) {
    lambdas.forEach((l) => {
      l.addEnvironment(DD_FLUSH_TO_LOG, flushMetricstoLogs.toString())
      l.addEnvironment(DD_SITE, site)
    })
}


