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

export const siteList: string[] = ["datadoghq.com", "datadoghq.eu", "us3.datadoghq.com", "ddog-gov.com"];

export class Transport {
  flushMetricsToLogs: boolean;
  site: string;
  apiKey?: string;
  apiKMSKey?: string;

  constructor(flushMetricsToLogs?: boolean, site?: string, apiKey?: string, apiKMSKey?: string) {
    if (flushMetricsToLogs === undefined) {
      this.flushMetricsToLogs = transportDefaults.flushMetricsToLogs;
    } else {
      this.flushMetricsToLogs = flushMetricsToLogs;
    }

    if (site === undefined) {
      this.site = transportDefaults.site;
    } else {
      this.site = site;
    }

    if (!siteList.includes(this.site.toLowerCase())) {
      console.log(
        "Warning: Invalid site URL. Must be either datadoghq.com, datadoghq.eu, us3.datadoghq.com, or ddog-gov.com.",
      );
    }

    if (
      (apiKey !== undefined && apiKMSKey !== undefined && this.flushMetricsToLogs === false) ||
      (apiKey === undefined && apiKMSKey === undefined && this.flushMetricsToLogs === false)
    ) {
      throw new Error(
        "The parameters apiKey and apiKMSKey are mutually exclusive. Please set one or the other but not both if flushMetricsToLogs is set to false.",
      );
    } else {
      this.apiKey = apiKey;
      this.apiKMSKey = apiKMSKey;
    }
  }

  setEnvVars(lambdas: lambda.Function[]) {
    lambdas.forEach((lam) => {
      lam.addEnvironment(logForwardingEnvVar, this.flushMetricsToLogs.toString());
      if (this.site !== undefined && this.flushMetricsToLogs === false) {
        lam.addEnvironment(siteURLEnvVar, this.site);
      }
      if (this.apiKey !== undefined && this.flushMetricsToLogs === false) {
        lam.addEnvironment(apiKeyEnvVar, this.apiKey);
      }
      if (this.apiKMSKey !== undefined && this.flushMetricsToLogs === false) {
        lam.addEnvironment(apiKeyKMSEnvVar, this.apiKMSKey);
      }
    });
  }
}
