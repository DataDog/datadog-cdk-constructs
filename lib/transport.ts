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

export const transportDefaults = {
  site: "datadoghq.com",
  flushMetricsToLogs: true,
  enableDDTracing: true,
};

export class Transport {
  flushMetricsToLogs: boolean;
  site: string;
  apiKey?: string;
  apiKMSKey?: string;
  extensionLayerVersion?: number;

  constructor(
    flushMetricsToLogs?: boolean,
    site?: string,
    apiKey?: string,
    apiKMSKey?: string,
    extensionLayerVersion?: number,
  ) {
    if (flushMetricsToLogs === undefined) {
      this.flushMetricsToLogs = transportDefaults.flushMetricsToLogs;
    } else {
      this.flushMetricsToLogs = flushMetricsToLogs;
    }

    this.extensionLayerVersion = extensionLayerVersion;
    // If the extension is used, metrics will be submitted via the extension.
    if (this.extensionLayerVersion !== undefined) {
      this.flushMetricsToLogs = false;
    }

    if (site === undefined) {
      this.site = transportDefaults.site;
    } else {
      this.site = site;
    }

    this.apiKey = apiKey;
    this.apiKMSKey = apiKMSKey;
  }

  setEnvVars(lambdas: lambda.Function[]) {
    lambdas.forEach((lam) => {
      lam.addEnvironment(logForwardingEnvVar, this.flushMetricsToLogs.toString());
      if (this.site !== undefined && this.flushMetricsToLogs === false) {
        lam.addEnvironment(siteURLEnvVar, this.site);
      }
      if (this.apiKey !== undefined) {
        lam.addEnvironment(apiKeyEnvVar, this.apiKey);
      }
      if (this.apiKMSKey !== undefined) {
        lam.addEnvironment(apiKeyKMSEnvVar, this.apiKMSKey);
      }
    });
  }
}
