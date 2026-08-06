/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

import assert from "node:assert/strict";

import { functionName, verifierConfig } from "./helpers/e2e.config";
import { execPromise } from "./helpers/exec";
import { verifyInstrumented } from "./helpers/lambda-verifier";
import { FRESHNESS_TAG_KEY, RUN_ID_TAG_KEY } from "./helpers/naming";
import { E2E_RUNTIME } from "./helpers/versions";

interface LambdaConfiguration {
  FunctionArn: string;
  Runtime: string;
}

interface TagsResponse {
  Tags?: Record<string, string>;
}

const awsJson = async <T>(command: string): Promise<T> => {
  const result = await execPromise(command);
  assert.equal(result.exitCode, 0, result.stderr || result.stdout);

  return JSON.parse(result.stdout) as T;
};

export const verifyCdkInstrumented = async (
  serviceName: string,
  region: string,
  site: string,
  runId: string,
  createdTs: string,
): Promise<void> => {
  await verifyInstrumented(verifierConfig(site, runId), serviceName, region);

  const name = functionName(serviceName);
  const lambda = await awsJson<LambdaConfiguration>(
    `aws lambda get-function-configuration --function-name "${name}" --region "${region}" --output json`,
  );
  assert.equal(lambda.Runtime, E2E_RUNTIME.name, `runtime = ${lambda.Runtime}, want ${E2E_RUNTIME.name}`);

  const { Tags: tags = {} } = await awsJson<TagsResponse>(
    `aws lambda list-tags --resource "${lambda.FunctionArn}" --region "${region}" --output json`,
  );
  assert.equal(tags[FRESHNESS_TAG_KEY], createdTs, `${FRESHNESS_TAG_KEY} tag has the wrong timestamp`);
  assert.equal(tags[RUN_ID_TAG_KEY], runId, `${RUN_ID_TAG_KEY} tag has the wrong run id`);
};
