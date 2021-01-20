/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";

export const apiKeyEnvVar = "DD_API_KEY";
export const apiKeyKMSEnvVar = "DD_KMS_API_KEY";
export const siteURLEnvVar = "DD_SITE";
export const logForwardingEnvVar = "DD_FLUSH_TO_LOG";
export const logLevelEnvVar = "DD_LOG_LEVEL";
export const enableDDTracingEnvVar = "DD_TRACE_ENABLED";
export const injectLogContextEnvVar = "DD_LOG_INJECTION";

export const defaultEnvVar = {
  addLayers: true,
  site: "datadoghq.com",
  flushMetricsToLogs: true,
  logLevel: "info",
  enableDDTracing: true,
  injectLogContext: true
};

export function applyEnvVariables(
    lambdas: lambda.Function[],
    flushMetricsToLogs: boolean,
    site: string,
    apiKey: string | undefined,
    apiKMSKey: string | undefined,
    logLevel: string,
    enableDDTracing: boolean,
    injectLogContext: boolean
) {
  lambdas.forEach((l) => {
    if (flushMetricsToLogs === false && apiKey != undefined) {
      l.addEnvironment(apiKeyEnvVar, apiKey.toString());
    }
    if (flushMetricsToLogs === false && apiKMSKey != undefined) {
      l.addEnvironment(apiKeyKMSEnvVar, apiKMSKey.toString());
    }
    l.addEnvironment(logForwardingEnvVar, flushMetricsToLogs.toString().toLowerCase());
    l.addEnvironment(siteURLEnvVar, site.toLowerCase());
    l.addEnvironment(logLevelEnvVar, logLevel.toLowerCase());
    l.addEnvironment(enableDDTracingEnvVar, enableDDTracing.toString().toLowerCase());
    l.addEnvironment(injectLogContextEnvVar, injectLogContext.toString().toLowerCase());
  });
};
