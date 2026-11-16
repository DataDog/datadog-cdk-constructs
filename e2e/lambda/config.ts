/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

import * as lambda from "aws-cdk-lib/aws-lambda";

// Repo-local configuration for the Lambda suite. It is not synced from serverless-ci.

export const ENV_NAME = process.env.E2E_ENV ?? "e2e";
export const ENV_VERSION = process.env.E2E_VERSION ?? "1.0.0";
export const SITE = process.env.DD_SITE ?? "datadoghq.com";

// The suite instruments one runtime.
export const RUNTIME = lambda.Runtime.NODEJS_22_X;

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
};
