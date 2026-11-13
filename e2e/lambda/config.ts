/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

import * as lambda from "aws-cdk-lib/aws-lambda";
import { DatadogDefaultLayerVersions } from "../../src/index";
import { type ExpectedLayers, type LambdaVerifierConfig } from "../helpers/lambda-verifier";
import { type E2ENaming, RUN_ID_TAG_KEY } from "../helpers/naming";

// Repo-local configuration for the Lambda suite. It is not synced from serverless-ci.

export const NAMING: E2ENaming = { tool: "cdk", platform: "lambda" };

export const ENV_NAME = process.env.E2E_ENV ?? "e2e";
export const ENV_VERSION = process.env.E2E_VERSION ?? "1.0.0";
export const SITE = process.env.DD_SITE ?? "datadoghq.com";
export const REGION = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "ap-northeast-3";

// The suite instruments one runtime.
export const RUNTIME = lambda.Runtime.NODEJS_22_X;

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
};

// Transient cloud-provider errors safe to retry, passed as ExecOptions.retryPatterns.
export const RETRY_PATTERNS = [
  "Throttling",
  "TooManyRequests",
  "Rate exceeded",
  "RequestTimeout",
  "ServiceUnavailable",
  "InternalFailure",
  "ResourceConflictException",
  "ETIMEDOUT",
  "ECONNRESET",
  "EAI_AGAIN",
  "Connection reset",
];

// Datadog's public layer account for commercial regions.
const DD_LAYER_ACCOUNT_ID = "464622532012";

// The app names the function after the run-unique service name.
export const functionName = (serviceName: string): string => serviceName;

export const expectedLayerArns = (region: string): ExpectedLayers => ({
  node: `arn:aws:lambda:${region}:${DD_LAYER_ACCOUNT_ID}:layer:Datadog-Node22-x:${DatadogDefaultLayerVersions.NODE}`,
  extension: `arn:aws:lambda:${region}:${DD_LAYER_ACCOUNT_ID}:layer:Datadog-Extension:${DatadogDefaultLayerVersions.EXTENSION}`,
});

export const verifierConfig = (runId: string): LambdaVerifierConfig => ({
  functionName,
  expectedLayerArns,
  redirectHandler: "/opt/nodejs/node_modules/datadog-lambda-js/handler.handler",
  originalHandler: "index.handler",
  toolTag: { key: "dd_cdk_construct", pattern: /.+/ },
  env: {
    apiKeyVars: ["DD_API_KEY_SECRET_ARN"],
    present: [],
    values: (serviceName) => ({
      DD_SERVICE: serviceName,
      DD_ENV: ENV_NAME,
      DD_VERSION: ENV_VERSION,
      DD_SITE: SITE,
      DD_TAGS: `${RUN_ID_TAG_KEY}:${runId}`,
      DD_TRACE_ENABLED: "true",
      // With the extension, the construct collects logs through DD_SERVERLESS_LOGS_ENABLED and turns
      // off DD_LOGS_INJECTION.
      DD_SERVERLESS_LOGS_ENABLED: "true",
      DD_LOGS_INJECTION: "false",
      DD_LAMBDA_HANDLER: "index.handler",
    }),
  },
});
