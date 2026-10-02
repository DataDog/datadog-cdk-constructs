/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

import { client, v2 } from "@datadog/datadog-api-client";

// Mirrors datadog-ci's ECS Fargate telemetry check rather than the shared Lambda checker: the
// identity is part of the query, so a match proves the service, env, version, and run reached
// Datadog together. The injected tracer records the run id as a span attribute (`@`), while FireLens
// sends it as a log tag.

const POLL_INTERVAL_SECONDS = 30;
const MAX_ATTEMPTS = 20;

const waitFor = (seconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

export interface TelemetryIdentity {
  serviceName: string;
  env: string;
  version: string;
  /** The `key:value` tag that singles out this run's telemetry. */
  runIdTag: string;
}

interface TrafficOptions {
  attempts: number;
  requiredSuccesses: number;
  intervalSeconds: number;
}

/**
 * Polls the application until it serves several successful responses. One success can be a fluke
 * while the task is still starting, and the sustained requests are what produce the traces and logs.
 */
export const triggerTraffic = async (
  url: string,
  { attempts, requiredSuccesses, intervalSeconds }: TrafficOptions,
): Promise<void> => {
  let successes = 0;
  let lastError = "";

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      const body = await response.text();
      console.log(`[traffic] attempt ${attempt}/${attempts} returned ${response.status}`);
      if (response.ok) {
        successes++;
        if (successes >= requiredSuccesses) {
          return;
        }
      } else {
        lastError = `${response.status}: ${body.slice(0, 200)}`;
      }
    } catch (error) {
      lastError = String(error);
      console.log(`[traffic] attempt ${attempt}/${attempts} failed: ${lastError}`);
    }

    if (attempt < attempts) {
      await waitFor(intervalSeconds);
    }
  }
  throw new Error(`Failed to trigger traffic at ${url}: ${lastError}`);
};

const buildConfiguration = (site: string): client.Configuration => {
  const configuration = client.createConfiguration({
    authMethods: {
      apiKeyAuth: process.env.DATADOG_API_KEY ?? process.env.DD_API_KEY,
      appKeyAuth: process.env.DATADOG_APP_KEY ?? process.env.DD_APP_KEY,
    },
    // node-fetch can fail while decoding compressed search responses.
    httpConfig: { compress: false },
  });
  configuration.setServerVariables({ site });
  return configuration;
};

// Polling cannot fix credentials, so an authentication failure ends the check immediately.
const authErrorCode = (error: unknown): number | undefined => {
  const code = (error as { code?: unknown })?.code;
  return code === 401 || code === 403 ? code : undefined;
};

const pollUntilFound = async (label: string, query: () => Promise<unknown[]>): Promise<void> => {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`[${label}] attempt ${attempt}/${MAX_ATTEMPTS}`);
    try {
      const results = await query();
      if (results.length > 0) {
        console.log(`[${label}] found ${results.length} matching record(s)`);
        return;
      }
    } catch (error) {
      const code = authErrorCode(error);
      if (code !== undefined) {
        throw new Error(
          `[${label}] authentication failed (HTTP ${code}): check DATADOG_API_KEY, DATADOG_APP_KEY, and DD_SITE`,
        );
      }
      console.error(`[${label}] query error:`, error);
    }

    if (attempt < MAX_ATTEMPTS) {
      await waitFor(POLL_INTERVAL_SECONDS);
    }
  }
  throw new Error(`[${label}] timed out after ${MAX_ATTEMPTS * POLL_INTERVAL_SECONDS}s`);
};

const recentWindow = (): { from: string; to: string } => {
  const now = new Date();
  return { from: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), to: now.toISOString() };
};

export const checkTelemetryFlowing = async (identity: TelemetryIdentity, site: string): Promise<void> => {
  const configuration = buildConfiguration(site);
  const { serviceName, env, version, runIdTag } = identity;

  const querySpans = async (): Promise<unknown[]> => {
    const response = await new v2.SpansApi(configuration).listSpans({
      body: {
        data: {
          attributes: {
            filter: { query: `@service:${serviceName} env:${env} @version:${version} @${runIdTag}`, ...recentWindow() },
            page: { limit: 5 },
          },
          type: "search_request",
        },
      },
    });
    return response.data ?? [];
  };

  const queryLogs = async (): Promise<unknown[]> => {
    const response = await new v2.LogsApi(configuration).listLogs({
      body: {
        filter: { query: `service:${serviceName} env:${env} version:${version} ${runIdTag}`, ...recentWindow() },
        page: { limit: 5 },
      },
    });
    return response.data ?? [];
  };

  await Promise.all([pollUntilFound("spans", querySpans), pollUntilFound("logs", queryLogs)]);
};
