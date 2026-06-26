/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

import { type E2ENaming } from "./naming";
import { type ExpectedLayers, type LambdaVerifierConfig } from "./lambda-verifier";
import { E2E_EXTENSION_LAYER_VERSION, E2E_NODE_LAYER_VERSION } from "./versions";

// Repo-local config feeding the shared e2e helpers. This file is NOT synced -- it holds
// everything specific to datadog-cdk-constructs that the shared, parameterized helpers
// read through their config arguments.

export const NAMING: E2ENaming = { tool: "cdk", platform: "lambda" };

export const ENV_NAME = process.env.E2E_ENV ?? "e2e";
export const ENV_VERSION = process.env.E2E_VERSION ?? "1.0.0";

// Datadog's public layer account (commercial, non-GovCloud). The e2e defaults to ap-northeast-3.
const DD_ACCOUNT_ID = "464622532012";

// Transient cloud-provider errors safe to retry, passed as ExecOptions.retryPatterns.
export const RETRY_PATTERNS = [
  "RequestTimeout",
  "Throttling",
  "TooManyRequests",
  "Rate exceeded",
  "ServiceUnavailable",
  "InternalFailure",
  "ResourceConflictException",
  "OperationAbortedException",
  "ETIMEDOUT",
  "ECONNRESET",
  "EAI_AGAIN",
  "Connection reset",
  "timed out",
  "UPDATE_IN_PROGRESS",
];

// The CDK app names the function after the run-unique service name, so the deployed
// function name is the service name itself.
export const functionName = (serviceName: string): string => serviceName;

// Pinned artifact versions come from this repo's e2e/helpers/versions.ts, so a version
// mismatch blames the construct's wiring, not upstream layer drift.
const expectedLayerArns = (region: string): ExpectedLayers => ({
  node: `arn:aws:lambda:${region}:${DD_ACCOUNT_ID}:layer:Datadog-Node22-x:${E2E_NODE_LAYER_VERSION}`,
  extension: `arn:aws:lambda:${region}:${DD_ACCOUNT_ID}:layer:Datadog-Extension:${E2E_EXTENSION_LAYER_VERSION}`,
});

export const VERIFIER: LambdaVerifierConfig = {
  functionName,
  expectedLayerArns,
  redirectHandler: "/opt/nodejs/node_modules/datadog-lambda-js/handler.handler",
  originalHandler: "index.handler",
  // The construct tags every instrumented function with its own marker tag.
  toolTag: { key: "dd_cdk_construct", pattern: /.+/ },
  env: {
    apiKeyVars: ["DD_API_KEY", "DD_API_KEY_SECRET_ARN", "DD_KMS_API_KEY", "DD_API_KEY_SSM_ARN"],
    present: ["DD_SITE"],
    values: (serviceName) => ({
      DD_SERVICE: serviceName,
      DD_ENV: ENV_NAME,
      DD_VERSION: ENV_VERSION,
      DD_TRACE_ENABLED: "true",
      // With the extension, log collection is enabled via DD_SERVERLESS_LOGS_ENABLED;
      // the construct intentionally forces DD_LOGS_INJECTION=false in this path.
      DD_SERVERLESS_LOGS_ENABLED: "true",
      DD_LOGS_INJECTION: "false",
      DD_LAMBDA_HANDLER: "index.handler",
    }),
  },
};
