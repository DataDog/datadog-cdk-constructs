/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

import { rm } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  activeRevisions,
  describeService,
  describeTaskDefinition,
  resolveNetwork,
  taskUrl,
  waitForAgentHealthy,
} from "./ecs-fargate/aws";
import {
  ENV_NAME,
  ENV_VERSION,
  type EcsResources,
  NAMING,
  REGION,
  RETRY_PATTERNS,
  type ResolvedNetwork,
  SERVICE_SSI_CASE,
  SITE,
  SSI_CASES,
  languageFamily,
  requireEcsResources,
} from "./ecs-fargate/config";
import { checkTelemetryFlowing, triggerTraffic } from "./ecs-fargate/telemetry";
import {
  verifyLogCollection,
  verifyRemoved,
  verifyServiceInstrumented,
  verifySsiInstrumented,
} from "./ecs-fargate/verifier";
import { execPromise, execPromiseWithRetries, type ExecResult } from "./helpers/exec";
import { RUN_ID_TAG_KEY, freshnessTimestamp, namePrefix, newRunId } from "./helpers/naming";

// Creating and replacing a Fargate service waits for its tasks to reach a steady state.
const DEPLOY_TIMEOUT_MS = 1_200_000;
const LIFECYCLE_TIMEOUT_MS = 2_700_000;
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

const requireAnyEnv = (names: string[]): void => {
  if (!names.some((name) => process.env[name])) {
    throw new Error(`Missing required environment variable: one of ${names.join(", ")}`);
  }
};

const assertSuccess = (result: ExecResult, message: string): void => {
  expect(result.exitCode, `${message}: ${result.stderr || result.stdout}`).toBe(0);
};

describe("cdk ecs fargate e2e", () => {
  const runId = newRunId();
  const serviceName = namePrefix(NAMING, runId);
  const createdTs = freshnessTimestamp();
  const runIdTag = `${RUN_ID_TAG_KEY}:${runId}`;
  const families = [serviceName, ...SSI_CASES.map(({ language }) => languageFamily(serviceName, language))];
  const buildDir = "e2e/.build/ecs-fargate";
  const appBundle = `${buildDir}/app.cjs`;

  let account: string;
  let resources: EcsResources;
  let network: ResolvedNetwork;
  let canDestroy = false;
  let removed = false;

  const appEnv = (instrument: boolean): Record<string, string | undefined> => ({
    E2E_SERVICE_NAME: serviceName,
    E2E_RUN_ID: runId,
    E2E_CREATED_TS: createdTs,
    E2E_INSTRUMENT: instrument ? "true" : "false",
    E2E_ENV: ENV_NAME,
    E2E_VERSION: ENV_VERSION,
    E2E_NETWORK: JSON.stringify(network),
    DD_SITE: SITE,
    CDK_DEFAULT_ACCOUNT: account,
    CDK_DEFAULT_REGION: REGION,
    AWS_REGION: REGION,
  });

  const assemblyDir = (instrument: boolean): string => `${buildDir}/cdk-${instrument ? "instrumented" : "baseline"}`;

  const synthesize = async (instrument: boolean): Promise<void> => {
    const output = assemblyDir(instrument);
    await rm(output, { recursive: true, force: true });
    const result = await execPromise(
      `npx cdk --app "node ${appBundle}" --output "${output}" synth "${serviceName}" --quiet`,
      { env: appEnv(instrument) },
    );
    assertSuccess(result, "Failed to synthesize workload");
  };

  const deploy = (instrument: boolean) =>
    execPromiseWithRetries(
      `npx cdk --app "${assemblyDir(instrument)}" deploy "${serviceName}" --require-approval never`,
      { env: appEnv(instrument), retryPatterns: RETRY_PATTERNS },
    );

  const destroy = () =>
    execPromiseWithRetries(`npx cdk --app "${assemblyDir(false)}" destroy "${serviceName}" --force`, {
      env: appEnv(false),
      retryPatterns: RETRY_PATTERNS,
    });

  beforeAll(async () => {
    await runPhase("validating credentials and resources", async () => {
      // The Agent reads its key from AWS_ECS_API_KEY_SECRET_ARN; these keys query the telemetry.
      requireAnyEnv(["DATADOG_API_KEY", "DD_API_KEY"]);
      requireAnyEnv(["DATADOG_APP_KEY", "DD_APP_KEY"]);
      resources = requireEcsResources();

      const identity = await execPromise("aws sts get-caller-identity --query Account --output text", {
        logOutput: false,
      });
      assertSuccess(identity, "AWS credential validation failed");
      account = identity.stdout;

      const configuredAccount = process.env.CDK_DEFAULT_ACCOUNT;
      if (configuredAccount && configuredAccount !== account) {
        throw new Error(`CDK_DEFAULT_ACCOUNT is ${configuredAccount}, but AWS credentials belong to ${account}`);
      }
    });

    await runPhase("resolving the service network", async () => {
      network = await resolveNetwork(resources.subnets);
    });

    await runPhase("bundling the CDK app", async () => {
      const bundle = await execPromise(
        `npx esbuild e2e/ecs-fargate/app.ts --bundle --platform=node --target=node22 --packages=external --outfile=${appBundle}`,
      );
      assertSuccess(bundle, "Failed to bundle CDK app");
    });

    await runPhase("synthesizing the baseline workload", async () => {
      await synthesize(false);
      canDestroy = true;
    });

    await runPhase("deploying the baseline workload", async () => {
      assertSuccess(await deploy(false), "Failed to provision workload");
    });
  }, DEPLOY_TIMEOUT_MS);

  afterAll(async () => {
    try {
      if (!canDestroy || removed) {
        return;
      }

      const result = await runPhase("cleaning up the workload", destroy);
      if (result.exitCode !== 0) {
        console.error(`Failed to destroy workload stack ${serviceName}: ${result.stderr || result.stdout}`);
      }
    } finally {
      await rm(buildDir, { recursive: true, force: true });
    }
  }, DEPLOY_TIMEOUT_MS);

  it(
    "runs the instrumentation lifecycle",
    async () => {
      await runPhase("synthesizing the instrumented workload", () => synthesize(true));

      await runPhase("instrumenting the workload", async () => {
        assertSuccess(await deploy(true), "Failed to instrument workload");
      });

      let taskDefinitionArn = "";
      await runPhase("verifying the deployed configuration", async () => {
        // Replacing a task definition deregisters the baseline revision, so nothing is duplicated.
        for (const family of families) {
          expect(await activeRevisions(family), `active revisions of ${family}`).toHaveLength(1);
        }
        [taskDefinitionArn] = await activeRevisions(serviceName);
        const service = await describeService(resources.cluster, serviceName);
        expect(service.status).toBe("ACTIVE");
        expect(service.taskDefinition, "the service runs the instrumented revision").toBe(taskDefinitionArn);

        const serviceTaskDefinition = await describeTaskDefinition(taskDefinitionArn);
        const apiKeyValueFrom = resources.apiKeySecret.valueFrom;
        verifyServiceInstrumented(serviceTaskDefinition, {
          service: serviceName,
          env: ENV_NAME,
          version: ENV_VERSION,
          site: SITE,
          runId,
          createdTs,
          apiKeyValueFrom,
        });
        verifyLogCollection(serviceTaskDefinition, { service: serviceName, runId, apiKeyValueFrom });
        verifySsiInstrumented(serviceTaskDefinition, SERVICE_SSI_CASE);

        for (const ssiCase of SSI_CASES) {
          verifySsiInstrumented(await describeTaskDefinition(languageFamily(serviceName, ssiCase.language)), ssiCase);
        }
      });

      await runPhase("waiting for the Datadog Agent", () =>
        waitForAgentHealthy(resources.cluster, serviceName, taskDefinitionArn),
      );

      await runPhase("sending traffic to the service", async () => {
        const url = await taskUrl(resources.cluster, serviceName, taskDefinitionArn);
        await triggerTraffic(url, { attempts: 20, requiredSuccesses: 5, intervalSeconds: 10 });
      });

      await runPhase("waiting for Datadog telemetry", () =>
        checkTelemetryFlowing({ serviceName, env: ENV_NAME, version: ENV_VERSION, runIdTag }, SITE),
      );

      await runPhase("checking CDK idempotence", async () => {
        await synthesize(true);
        const diff = await execPromise(`npx cdk --app "${assemblyDir(true)}" diff "${serviceName}" --fail`, {
          env: appEnv(true),
        });
        assertSuccess(diff, "Expected no diff on re-apply");
      });

      await runPhase("removing the workload", async () => {
        assertSuccess(await destroy(), "Failed to remove workload");
        removed = true;
      });

      await runPhase("verifying cleanup", () => verifyRemoved(resources.cluster, serviceName, families));
    },
    LIFECYCLE_TIMEOUT_MS,
  );
});
