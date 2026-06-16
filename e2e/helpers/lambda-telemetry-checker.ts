/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import assert from "node:assert/strict";
import { client, v2 } from "@datadog/datadog-api-client";
import { RUN_ID_TAG_KEY } from "./naming";

// Poll spans + logs on a bounded budget (15s x 20 = 5min), then assert the
// ingested telemetry carries the expected identity -- service/env/version/run id --
// not merely that *something* showed up. Runner-agnostic. See spec.md.
const POLL_INTERVAL_SECONDS = 15;
const MAX_ATTEMPTS = 20;

export interface IdentityExpectation {
  serviceName: string;
  runId: string;
  env: string;
  version: string;
}

const waitFor = (seconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const pollUntil = async <T>(
  label: string,
  query: () => Promise<T[]>,
  assertIdentity: (item: T) => void,
): Promise<void> => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[${label}] attempt ${attempt}/${MAX_ATTEMPTS}`);
    try {
      const results = await query();
      if (results.length > 0) {
        console.log(`[${label}] found ${results.length} item(s); asserting identity`);
        assertIdentity(results[0]);

        return;
      }
    } catch (error) {
      console.error(`[${label}] query error:`, error);
    }
    if (attempt < MAX_ATTEMPTS) {
      await waitFor(POLL_INTERVAL_SECONDS);
    }
  }
  throw new Error(`[${label}] timed out after ${MAX_ATTEMPTS} attempts (${MAX_ATTEMPTS * POLL_INTERVAL_SECONDS}s)`);
};

const window = (): { from: string; to: string } => {
  const now = new Date();

  return { from: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), to: now.toISOString() };
};

export const checkTelemetryFlowing = async (expected: IdentityExpectation): Promise<void> => {
  const { serviceName, runId, env, version } = expected;
  const configuration = client.createConfiguration({
    authMethods: {
      apiKeyAuth: process.env.DATADOG_API_KEY ?? process.env.DD_API_KEY,
      appKeyAuth: process.env.DATADOG_APP_KEY ?? process.env.DD_APP_KEY,
    },
  });
  if (process.env.DD_SITE) {
    configuration.setServerVariables({ site: process.env.DD_SITE });
  }

  const spansApi = new v2.SpansApi(configuration);
  const logsApi = new v2.LogsApi(configuration);
  // Filter on the unique run id so we only ever see telemetry from this run.
  const filterQuery = `service:${serviceName} @${RUN_ID_TAG_KEY}:${runId}`;
  const logsQuery = `service:${serviceName} ${RUN_ID_TAG_KEY}:${runId}`;

  await Promise.all([
    pollUntil(
      "spans",
      async () => {
        const { from, to } = window();
        const res = await spansApi.listSpans({
          body: {
            data: {
              attributes: { filter: { query: filterQuery, from, to }, page: { limit: 5 } },
              type: "search_request",
            },
          },
        });

        return res.data ?? [];
      },
      (span) => {
        // v2 Spans API: service is top-level; env/version/custom tags live in `custom`.
        const attrs = span.attributes ?? {};
        const custom = (attrs.custom ?? {}) as Record<string, unknown>;
        assert.equal(attrs.service ?? custom.service, serviceName, "span service mismatch");
        assert.equal(custom.env, env, "span env mismatch");
        assert.equal(custom.version, version, "span version mismatch");
        assert.equal(custom[RUN_ID_TAG_KEY], runId, "span run id mismatch");
      },
    ),
    pollUntil(
      "logs",
      async () => {
        const { from, to } = window();
        const res = await logsApi.listLogs({ body: { filter: { query: logsQuery, from, to }, page: { limit: 5 } } });

        return res.data ?? [];
      },
      (logItem) => {
        const attrs = logItem.attributes?.attributes ?? {};
        const tags = logItem.attributes?.tags ?? [];
        assert.equal(attrs.service ?? logItem.attributes?.service, serviceName, "log service mismatch");
        assert.ok(tags.includes(`env:${env}`), `expected env:${env} in log tags ${JSON.stringify(tags)}`);
        assert.ok(tags.includes(`version:${version}`), `expected version:${version} in log tags`);
        assert.ok(tags.includes(`${RUN_ID_TAG_KEY}:${runId}`), `expected run id in log tags`);
      },
    ),
  ]);
};
