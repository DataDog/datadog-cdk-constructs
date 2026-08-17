/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ENV_NAME, ENV_VERSION, NAMING, RETRY_PATTERNS, expectedLayerArns } from "./helpers/e2e.config";
import { execPromise, execPromiseWithRetries, type ExecResult } from "./helpers/exec";
import { checkTelemetryFlowing } from "./helpers/lambda-telemetry-checker";
import { freshnessTimestamp, namePrefix, newRunId } from "./helpers/naming";
import { verifyCdkClean, verifyCdkInstrumented } from "./verifier";

const DEPLOY_TIMEOUT_MS = 900_000;
const LIFECYCLE_TIMEOUT_MS = 1_800_000;
const HEARTBEAT_INTERVAL_MS = 30_000;

const elapsed = (started: number): string => `${Math.round((Date.now() - started) / 1000)}s`;

const runPhase = async <T>(name: string, action: () => Promise<T>): Promise<T> => {
  const started = Date.now();
  console.log(`START: ${name}`);
  const heartbeat = setInterval(() => {
    console.log(`RUNNING: ${name} (${elapsed(started)} elapsed)`);
  }, HEARTBEAT_INTERVAL_MS);

  try {
    return await action();
  } finally {
    clearInterval(heartbeat);
    console.log(`DONE: ${name} (${elapsed(started)})`);
  }
};

const requireEnv = (name: string): void => {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable ${name}`);
  }
};

const requireAnyEnv = (names: string[]): void => {
  if (!names.some((name) => process.env[name])) {
    throw new Error(`Missing required environment variable: one of ${names.join(", ")}`);
  }
};

const assertSuccess = (result: ExecResult, message: string): void => {
  expect(result.exitCode, `${message}: ${result.stderr || result.stdout}`).toBe(0);
};

interface TemplateResource {
  Type: string;
  Properties?: { Layers?: string[] };
}

interface CloudFormationTemplate {
  Resources: Record<string, TemplateResource>;
}

describe("cdk lambda e2e", () => {
  const region = process.env.AWS_REGION ?? "ap-northeast-3";
  const runId = newRunId();
  const serviceName = namePrefix(NAMING, runId);
  const createdTs = freshnessTimestamp();
  const env = ENV_NAME;
  const version = ENV_VERSION;
  const site = process.env.DD_SITE ?? "datadoghq.com";
  const buildDir = "e2e/.build";
  const appBundle = `${buildDir}/app.cjs`;

  let account: string;
  let canDestroy = false;
  let removed = false;

  const baseEnv = (instrument: boolean): Record<string, string | undefined> => ({
    E2E_SERVICE_NAME: serviceName,
    E2E_RUN_ID: runId,
    E2E_CREATED_TS: createdTs,
    E2E_INSTRUMENT: instrument ? "true" : "false",
    E2E_ENV: env,
    E2E_VERSION: version,
    DD_SITE: site,
    CDK_DEFAULT_ACCOUNT: account,
    CDK_DEFAULT_REGION: region,
    AWS_REGION: region,
  });

  const assemblyDir = (instrument: boolean): string => `${buildDir}/cdk-${instrument ? "instrumented" : "baseline"}`;

  const synthesize = async (instrument: boolean): Promise<void> => {
    const output = assemblyDir(instrument);
    await rm(output, { recursive: true, force: true });
    const result = await execPromise(
      `npx cdk --app "node ${appBundle}" --output "${output}" synth "${serviceName}" --quiet`,
      { env: baseEnv(instrument) },
    );
    assertSuccess(result, "Failed to synthesize workload");

    if (instrument) {
      const templates = (await readdir(output)).filter((file) => file.endsWith(".template.json"));
      expect(templates, "Expected one synthesized stack template").toHaveLength(1);
      const template = JSON.parse(await readFile(path.join(output, templates[0]), "utf8")) as CloudFormationTemplate;
      const functions = Object.values(template.Resources).filter(
        (resource) => resource.Type === "AWS::Lambda::Function",
      );
      expect(functions, "Expected one synthesized Lambda function").toHaveLength(1);

      const layers = functions[0].Properties?.Layers ?? [];
      for (const expected of Object.values(expectedLayerArns(region))) {
        expect(
          layers.filter((layer) => layer === expected),
          `Expected pinned layer ${expected}; got ${layers}`,
        ).toHaveLength(1);
      }
    }
  };

  const deploy = (instrument: boolean) =>
    execPromiseWithRetries(
      `npx cdk --app "${assemblyDir(instrument)}" deploy "${serviceName}" --require-approval never`,
      {
        env: baseEnv(instrument),
        retryPatterns: RETRY_PATTERNS,
      },
    );

  const destroy = () =>
    execPromiseWithRetries(`npx cdk --app "${assemblyDir(false)}" destroy "${serviceName}" --force`, {
      env: baseEnv(false),
      retryPatterns: RETRY_PATTERNS,
    });

  beforeAll(async () => {
    await runPhase("validating credentials", async () => {
      requireEnv("DD_API_KEY");
      requireAnyEnv(["DATADOG_APP_KEY", "DD_APP_KEY"]);

      const identity = await execPromise("aws sts get-caller-identity --query Account --output text");
      assertSuccess(identity, "AWS credential validation failed");
      account = identity.stdout;

      const configuredAccount = process.env.CDK_DEFAULT_ACCOUNT;
      if (configuredAccount && configuredAccount !== account) {
        throw new Error(`CDK_DEFAULT_ACCOUNT is ${configuredAccount}, but AWS credentials belong to ${account}`);
      }
    });

    await runPhase("bundling the CDK app", async () => {
      const bundle = await execPromise(
        `npx esbuild e2e/app/app.ts --bundle --platform=node --target=node22 --packages=external --outfile=${appBundle}`,
      );
      assertSuccess(bundle, "Failed to bundle CDK app");
    });

    await runPhase("synthesizing the baseline function", async () => {
      await synthesize(false);
      canDestroy = true;
    });

    await runPhase("deploying the baseline function", async () => {
      assertSuccess(await deploy(false), "Failed to provision workload");
    });
  }, DEPLOY_TIMEOUT_MS);

  afterAll(async () => {
    try {
      if (!canDestroy || removed) {
        return;
      }

      const result = await runPhase("cleaning up the function", destroy);
      if (result.exitCode !== 0) {
        console.error(`Failed to destroy workload stack: ${result.stderr || result.stdout}`);
      }
    } finally {
      await rm(buildDir, { recursive: true, force: true });
    }
  }, DEPLOY_TIMEOUT_MS);

  it(
    "runs the instrumentation lifecycle",
    async () => {
      await runPhase("synthesizing the instrumented function", () => synthesize(true));

      await runPhase("instrumenting the function", async () => {
        assertSuccess(await deploy(true), "Failed to instrument workload");
      });

      await runPhase("verifying the deployed configuration", () =>
        verifyCdkInstrumented(serviceName, region, site, runId, createdTs),
      );

      await runPhase("invoking the function", async () => {
        const invoke = await execPromiseWithRetries(
          `aws lambda invoke --function-name "${serviceName}" --region "${region}" --payload '{}' --cli-binary-format raw-in-base64-out /dev/null`,
          { retryPatterns: RETRY_PATTERNS },
        );
        assertSuccess(invoke, "Failed to invoke workload");
      });

      await runPhase("waiting for Datadog telemetry", () =>
        checkTelemetryFlowing({ serviceName, env, version, runId }),
      );

      await runPhase("checking CDK idempotence", async () => {
        await synthesize(true);
        const diff = await execPromise(`npx cdk --app "${assemblyDir(true)}" diff "${serviceName}" --fail`, {
          env: baseEnv(true),
        });
        assertSuccess(diff, "Expected no diff on re-apply");
      });

      await runPhase("removing the function", async () => {
        const result = await destroy();
        assertSuccess(result, "Failed to remove workload");
        removed = true;
      });

      await runPhase("verifying cleanup", () => verifyCdkClean(serviceName, region, site, runId));
    },
    LIFECYCLE_TIMEOUT_MS,
  );
});
