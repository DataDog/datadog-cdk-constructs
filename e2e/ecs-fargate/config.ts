/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

import { TracerLanguage } from "../../src/index";
import { type E2ENaming } from "../helpers/naming";

// Repo-local configuration for the ECS Fargate suite. It is not synced from serverless-ci.

export const NAMING: E2ENaming = { tool: "cdk", platform: "ecs" };

export const ENV_NAME = process.env.E2E_ENV ?? "e2e";
export const ENV_VERSION = process.env.E2E_VERSION ?? "1.0.0";
export const SITE = process.env.DD_SITE ?? "datadoghq.com";

// The ECS resources the suite deploys into live in this region.
export const REGION = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "eu-central-1";

export const APP_CONTAINER_NAME = "app";
export const APP_CONTAINER_PORT = 8080;

// Transient cloud-provider errors safe to retry, passed as ExecOptions.retryPatterns.
export const RETRY_PATTERNS = [
  "Throttling",
  "TooManyRequests",
  "Rate exceeded",
  "RequestTimeout",
  "ServiceUnavailable",
  "InternalFailure",
  "ETIMEDOUT",
  "ECONNRESET",
  "EAI_AGAIN",
  "Connection reset",
];

export const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
};

/**
 * The account resources the suite deploys into. They are provisioned outside this repository and
 * shared with datadog-ci's ECS Fargate suite, which reads the same variables.
 */
export interface EcsResources {
  readonly cluster: string;
  readonly subnets: string[];
  readonly securityGroup: string;
  readonly appImageRegistry: string;
  readonly logGroup: string;
}

export const requireEcsResources = (): EcsResources => ({
  cluster: requireEnv("AWS_ECS_CLUSTER"),
  subnets: requireEnv("AWS_ECS_SUBNETS")
    .split(",")
    .map((subnet) => subnet.trim())
    .filter(Boolean),
  securityGroup: requireEnv("AWS_ECS_SECURITY_GROUP"),
  appImageRegistry: requireEnv("AWS_ECS_APP_IMAGE_REGISTRY"),
  logGroup: requireEnv("AWS_ECS_LOG_GROUP"),
});

/** The dd-sts API key. The Agent and FireLens submit with it, and the checker queries with it. */
export const requireApiKey = (): string => {
  const apiKey = process.env.DATADOG_API_KEY || process.env.DD_API_KEY;
  if (!apiKey) {
    throw new Error("Missing required environment variable: one of DATADOG_API_KEY, DD_API_KEY");
  }
  return apiKey;
};

/** The VPC and availability zones of the configured subnets, which the CDK app cannot look up. */
export interface ResolvedNetwork {
  readonly vpcId: string;
  readonly subnets: { readonly subnetId: string; readonly availabilityZone: string }[];
}

export const appImage = (registry: string, fixtureImageName: string): string =>
  `${registry}/${fixtureImageName}:latest`;

export const languageFamily = (serviceName: string, language: TracerLanguage): string => `${serviceName}-${language}`;

export interface SsiCase {
  readonly language: TracerLanguage;
  /** An application image in AWS_ECS_APP_IMAGE_REGISTRY that serves HTTP without a tracer. */
  readonly fixtureImageName: string;
  /** The `dd-lib-<repository>-init` image the tracer is copied from. */
  readonly tracerRepository: string;
  /** The startup variable fragment that makes the application load the copied tracer. */
  readonly nativeEnv: { readonly name: string; readonly value: string };
}

// The service runs this case, so it is the one whose tracer is proven to load and send traces.
export const SERVICE_SSI_CASE: SsiCase = {
  language: TracerLanguage.NODEJS,
  fixtureImageName: "node-ssi",
  tracerRepository: "js",
  nativeEnv: { name: "NODE_OPTIONS", value: "--require /datadog-lib/node_modules/dd-trace/init.js" },
};

// Mirrors datadog-ci's SSI cases. Each language gets a task definition that is registered and
// verified but never run.
export const SSI_CASES: readonly SsiCase[] = [
  {
    language: TracerLanguage.DOTNET,
    fixtureImageName: "dotnet-ssi",
    tracerRepository: "dotnet",
    nativeEnv: { name: "CORECLR_PROFILER_PATH", value: "/datadog-lib/Datadog.Trace.ClrProfiler.Native.so" },
  },
  {
    language: TracerLanguage.JAVA,
    fixtureImageName: "java-ssi",
    tracerRepository: "java",
    nativeEnv: { name: "JAVA_TOOL_OPTIONS", value: "-javaagent:/datadog-lib/dd-java-agent.jar" },
  },
  SERVICE_SSI_CASE,
  {
    language: TracerLanguage.PHP,
    fixtureImageName: "php-ssi",
    tracerRepository: "php",
    nativeEnv: { name: "PHP_INI_SCAN_DIR", value: "/datadog-lib/linux-gnu/loader" },
  },
  {
    language: TracerLanguage.PYTHON,
    fixtureImageName: "python-ssi",
    tracerRepository: "python",
    nativeEnv: { name: "PYTHONPATH", value: "/datadog-lib" },
  },
  {
    language: TracerLanguage.RUBY,
    fixtureImageName: "ruby-ssi",
    tracerRepository: "ruby",
    nativeEnv: { name: "RUBYOPT", value: "-r/datadog-lib/auto_inject" },
  },
];
