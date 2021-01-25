import * as lambda from "@aws-cdk/aws-lambda";
import { site_list } from "./index";

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

  constructor(
    flush?: boolean,
    site?: string,
    apiKey?: string,
    apiKMSKey?: string,
  ) {
    if (flush === undefined) {
      this.flushMetricsToLogs = transportDefaults.flushMetricsToLogs;
    } else {
      this.flushMetricsToLogs = flush;
    }

    if (site === undefined) {
      this.site = transportDefaults.site;
    } else {
      this.site = site;
    }

    if (!site_list.includes(this.site.toLowerCase())) {
      throw new Error(
        "Invalid site URL. Must be either datadoghq.com, datadoghq.eu, us3.datadoghq.com, or ddog-gov.com.",
      );
    }

    if (
      (apiKey != undefined &&
        apiKMSKey != undefined &&
        this.flushMetricsToLogs === false) ||
      (apiKey === undefined &&
        apiKMSKey === undefined &&
        this.flushMetricsToLogs === false)
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
    //TODO: Only set env vars if they need to be set
    lambdas.forEach((l) => {
      l.addEnvironment(logForwardingEnvVar, String(this.flushMetricsToLogs));
      l.addEnvironment(siteURLEnvVar, this.site);
      if (this.apiKey !== undefined) {
        l.addEnvironment(apiKeyEnvVar, this.apiKey);
      }
      if (this.apiKMSKey !== undefined) {
        l.addEnvironment(apiKeyKMSEnvVar, this.apiKMSKey);
      }
    });
  }
}
