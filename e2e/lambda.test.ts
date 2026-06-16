/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import crypto from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { execPromise, execPromiseWithRetries, execSync } from "./helpers/exec";
import { verifyInstrumented, verifyUninstrumented } from "./helpers/lambda-verifier";
import { checkTelemetryFlowing } from "./helpers/lambda-telemetry-checker";
import { resourceName, freshnessTimestamp } from "./helpers/naming";

const DEPLOY_TIMEOUT_MS = 900_000;
const TELEMETRY_TIMEOUT_MS = 600_000;

const describeOrSkip = process.env.SKIP_LAMBDA_TESTS === "true" ? describe.skip : describe;

describeOrSkip("cdk lambda e2e", () => {
  const region = process.env.AWS_REGION ?? "us-east-1";
  const runId = crypto.randomBytes(4).toString("hex");
  const serviceName = resourceName(runId);
  const createdTs = freshnessTimestamp();
  const env = process.env.E2E_ENV ?? "e2e";
  const version = process.env.E2E_VERSION ?? "1.0.0";
  const site = process.env.DD_SITE ?? "datadoghq.com";

  // The repo's TS 6 toolchain is incompatible with ts-node, so the CDK app is
  // bundled to a single CJS file with esbuild (node_modules left external) and run
  // with plain node. The DatadogLambda construct is bundled from src -- the e2e
  // exercises the construct code in this repo, not a published package.
  const appBundle = "e2e/.build/app.cjs";
  const cdkBase = `npx cdk --app "node ${appBundle}" --output e2e/cdk.out`;

  // Both APPLY and REMOVE deploy this same stack; only E2E_INSTRUMENT differs.
  const baseEnv = (instrument: boolean): Record<string, string | undefined> => ({
    E2E_SERVICE_NAME: serviceName,
    E2E_RUN_ID: runId,
    E2E_CREATED_TS: createdTs,
    E2E_INSTRUMENT: instrument ? "true" : "false",
    E2E_ENV: env,
    E2E_VERSION: version,
    DD_SITE: site,
    CDK_DEFAULT_REGION: region,
    AWS_REGION: region,
    TS_NODE_PROJECT: "e2e/tsconfig.json",
  });

  const deploy = (instrument: boolean) =>
    execPromiseWithRetries(`${cdkBase} deploy "${serviceName}" --require-approval never`, baseEnv(instrument));

  beforeAll(async () => {
    // Bundle the CDK app (construct included from src) to a single CJS entrypoint.
    execSync(
      `npx esbuild e2e/app/app.ts --bundle --platform=node --target=node22 --packages=external --outfile=${appBundle}`,
    );

    // Provision the uninstrumented workload (unique name, freshness-tagged at creation).
    const result = await deploy(false);
    if (result.exitCode !== 0) {
      throw new Error(`Failed to provision workload: ${result.stderr || result.stdout}`);
    }
  }, DEPLOY_TIMEOUT_MS);

  afterAll(async () => {
    // Always tear down, even on failure.
    try {
      await execPromise(`${cdkBase} destroy "${serviceName}" --force`, baseEnv(false));
    } catch (error) {
      console.error("Failed to destroy workload stack:", error);
    }
  }, DEPLOY_TIMEOUT_MS);

  it(
    "APPLY instruments the function and config is correct",
    async () => {
      const result = await deploy(true);
      expect(result.exitCode, result.stderr || result.stdout).toBe(0);

      verifyInstrumented(region, { serviceName, runId, env, version, site });
    },
    DEPLOY_TIMEOUT_MS,
  );

  it(
    "telemetry flows to Datadog with the expected identity",
    async () => {
      const invoke = await execPromiseWithRetries(
        `aws lambda invoke --function-name "${serviceName}" --region "${region}" --payload '{}' --cli-binary-format raw-in-base64-out /dev/null`,
      );
      expect(invoke.exitCode, invoke.stderr).toBe(0);

      await checkTelemetryFlowing({ serviceName, runId, env, version });
    },
    TELEMETRY_TIMEOUT_MS,
  );

  it(
    "re-APPLY is idempotent (no diff)",
    async () => {
      const diff = await execPromise(`${cdkBase} diff "${serviceName}" --fail`, baseEnv(true));
      expect(diff.exitCode, `expected no diff on re-apply:\n${diff.stdout}\n${diff.stderr}`).toBe(0);
    },
    DEPLOY_TIMEOUT_MS,
  );

  it(
    "REMOVE uninstruments and the end-state is clean",
    async () => {
      const result = await deploy(false);
      expect(result.exitCode, result.stderr || result.stdout).toBe(0);

      verifyUninstrumented(region, serviceName);
    },
    DEPLOY_TIMEOUT_MS,
  );
});
