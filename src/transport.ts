/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
import log from "loglevel";
import { runtimeLookup, RuntimeType } from ".";

export const API_KEY_ENV_VAR = "DD_API_KEY";
export const API_KEY_SECRET_ARN_ENV_VAR = "DD_API_KEY_SECRET_ARN";
export const KMS_API_KEY_ENV_VAR = "DD_KMS_API_KEY";
export const SITE_URL_ENV_VAR = "DD_SITE";
export const FLUSH_METRICS_TO_LOGS_ENV_VAR = "DD_FLUSH_TO_LOG";

export const transportDefaults = {
  site: "datadoghq.com",
  flushMetricsToLogs: true,
  enableDatadogTracing: true,
};

export class Transport {
  flushMetricsToLogs: boolean;
  site: string;
  apiKey?: string;
  apiKeySecretArn?: string;
  apiKmsKey?: string;
  extensionLayerVersion?: number;

  constructor(
    flushMetricsToLogs?: boolean,
    site?: string,
    apiKey?: string,
    apiKeySecretArn?: string,
    apiKmsKey?: string,
    extensionLayerVersion?: number,
  ) {
    if (flushMetricsToLogs === undefined) {
      log.debug(`No value provided for flushMetricsToLogs, defaulting to ${transportDefaults.flushMetricsToLogs}`);
      this.flushMetricsToLogs = transportDefaults.flushMetricsToLogs;
    } else {
      this.flushMetricsToLogs = flushMetricsToLogs;
    }

    this.extensionLayerVersion = extensionLayerVersion;
    // If the extension is used, metrics will be submitted via the extension.
    if (this.extensionLayerVersion !== undefined) {
      log.debug(`Using extension version ${this.extensionLayerVersion}, metrics will be submitted via the extension`);
      this.flushMetricsToLogs = false;
    }

    if (site === undefined) {
      log.debug(`No value provided for site, defaulting to ${transportDefaults.site}`);
      this.site = transportDefaults.site;
    } else {
      this.site = site;
    }

    this.apiKey = apiKey;
    this.apiKeySecretArn = apiKeySecretArn;
    this.apiKmsKey = apiKmsKey;
  }

  applyEnvVars(lambdas: lambda.Function[]) {
    log.debug(`Setting Datadog transport environment variables...`);
    lambdas.forEach((lam) => {
      lam.addEnvironment(FLUSH_METRICS_TO_LOGS_ENV_VAR, this.flushMetricsToLogs.toString());
      if (this.site !== undefined && this.flushMetricsToLogs === false) {
        lam.addEnvironment(SITE_URL_ENV_VAR, this.site);
      }
      if (this.apiKey !== undefined) {
        lam.addEnvironment(API_KEY_ENV_VAR, this.apiKey);
      }
      const isNode = runtimeLookup[lam.runtime.name] === RuntimeType.NODE
      const isSendingSynchronousMetrics = this.extensionLayerVersion === undefined && !this.flushMetricsToLogs
      if (this.apiKeySecretArn !== undefined) {
        if (!(isSendingSynchronousMetrics && isNode)) {
          lam.addEnvironment(API_KEY_SECRET_ARN_ENV_VAR, this.apiKeySecretArn);
        } else {
          log.debug(`When using Synchronous Metrics in Node, \`apiKeySecretArn\` will be ignored.`)
        }
      } 
      if (this.apiKmsKey !== undefined) {
        lam.addEnvironment(KMS_API_KEY_ENV_VAR, this.apiKmsKey);
      }
    });
  }
}
