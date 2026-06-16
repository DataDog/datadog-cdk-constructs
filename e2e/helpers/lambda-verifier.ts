/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import assert from "node:assert/strict";
import { execSync } from "./exec";
import { E2E_EXTENSION_LAYER_VERSION, E2E_NODE_LAYER_VERSION } from "./versions";
import { FRESHNESS_TAG_KEY, RUN_ID_TAG_KEY } from "./naming";

// Helpers are runner-agnostic (no jest/vitest): assertions use node:assert/strict so
// the same code works under any runner. See spec.md ("Test Stacks & Shared Components").

interface FunctionConfiguration {
  Handler?: string;
  Layers?: { Arn: string }[];
  Environment?: { Variables?: Record<string, string> };
}

export interface IdentityExpectation {
  serviceName: string;
  runId: string;
  env: string;
  version: string;
  site: string;
}

const NODE_LAYER_FRAGMENT = `:layer:Datadog-Node22-x:${E2E_NODE_LAYER_VERSION}`;
const EXTENSION_LAYER_FRAGMENT = `:layer:Datadog-Extension`;

const getConfig = (serviceName: string, region: string): FunctionConfiguration =>
  JSON.parse(
    execSync(
      `aws lambda get-function-configuration --function-name "${serviceName}" --region "${region}" --output json`,
    ),
  );

const getTags = (serviceName: string, region: string): Record<string, string> => {
  const arn = execSync(
    `aws lambda get-function-configuration --function-name "${serviceName}" --region "${region}" --query FunctionArn --output text`,
  ).trim();
  const out = JSON.parse(execSync(`aws lambda list-tags --resource "${arn}" --region "${region}" --output json`));

  return out.Tags ?? {};
};

const layerArns = (config: FunctionConfiguration): string[] => (config.Layers ?? []).map((l) => l.Arn);

export const verifyInstrumented = (region: string, expected: IdentityExpectation): void => {
  const { serviceName, runId, env, version, site } = expected;
  console.log(`Verifying instrumented config for "${serviceName}"...`);
  const config = getConfig(serviceName, region);
  const tags = getTags(serviceName, region);
  const arns = layerArns(config);
  const vars = config.Environment?.Variables ?? {};

  // Pinned Datadog layers present (config present per the contract's mapping).
  assert.ok(
    arns.some((a) => a.includes(NODE_LAYER_FRAGMENT)),
    `expected Node layer ${NODE_LAYER_FRAGMENT} in ${JSON.stringify(arns)}`,
  );
  assert.ok(
    arns.some((a) => a.includes(`${EXTENSION_LAYER_FRAGMENT}:${E2E_EXTENSION_LAYER_VERSION}`)),
    `expected Extension layer v${E2E_EXTENSION_LAYER_VERSION} in ${JSON.stringify(arns)}`,
  );

  // Handler redirected to the Datadog wrapper -- proves the layer is actually wired in.
  assert.equal(config.Handler, "/opt/nodejs/node_modules/datadog-lambda-js/handler.handler");
  assert.equal(vars.DD_LAMBDA_HANDLER, "index.handler");

  // Required DD_* env vars set, asserted by *identity* not mere presence.
  assert.equal(vars.DD_SERVICE, serviceName);
  assert.equal(vars.DD_ENV, env);
  assert.equal(vars.DD_VERSION, version);
  assert.equal(vars.DD_SITE, site);
  assert.ok(vars.DD_API_KEY, "expected DD_API_KEY to be set");
  assert.equal(vars.DD_TRACE_ENABLED, "true");
  assert.equal(vars.DD_LOGS_INJECTION, "true");
  assert.ok(
    vars.DD_TAGS?.includes(`${RUN_ID_TAG_KEY}:${runId}`),
    `expected DD_TAGS to carry run id, got ${vars.DD_TAGS}`,
  );

  // In the extension path (no forwarder) the construct carries service/env/version
  // and the run id as DD_* env vars (asserted above) rather than resource tags; those
  // flow to telemetry via the extension and are asserted on ingested spans/logs by the
  // telemetry checker. The construct's own resource tag is dd_cdk_construct.
  assert.ok(tags.dd_cdk_construct, "expected dd_cdk_construct tag");
  assert.ok(tags[FRESHNESS_TAG_KEY], "expected freshness tag");

  console.log("All instrumented checks passed.");
};

export const verifyUninstrumented = (region: string, serviceName: string): void => {
  console.log(`Verifying uninstrumented (clean) config for "${serviceName}"...`);
  const config = getConfig(serviceName, region);
  const tags = getTags(serviceName, region);
  const arns = layerArns(config);
  const vars = config.Environment?.Variables ?? {};

  // No Datadog layers remain.
  assert.ok(
    !arns.some((a) => a.includes(":layer:Datadog-")),
    `expected no Datadog layers, got ${JSON.stringify(arns)}`,
  );

  // Handler reverted to the original; no DD_* env vars remain.
  assert.equal(config.Handler, "index.handler");
  const ddVars = Object.keys(vars).filter((k) => k.startsWith("DD_"));
  assert.deepEqual(ddVars, [], `expected no DD_* env vars, got ${ddVars.join(", ")}`);

  // The Datadog instrumentation resource tag is gone. The hygiene freshness tag
  // intentionally survives so the sweeper can still reap the bare function.
  assert.equal(tags.dd_cdk_construct, undefined, `expected dd_cdk_construct tag to be absent, got ${tags.dd_cdk_construct}`);
  assert.ok(tags[FRESHNESS_TAG_KEY], "expected freshness tag to survive remove");

  console.log("All uninstrumented checks passed.");
};
