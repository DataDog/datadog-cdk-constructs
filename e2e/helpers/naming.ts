/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

// Resource-hygiene convention shared with the cross-repo sweeper. Every resource
// this suite creates is named `one-e2e-<tool>-<platform>-<runid>` (the `one` team
// prefix + `dd-` implied) and carries a `one_e2e_created:<unix-ts>` freshness tag
// set atomically at creation. The sweeper lists `one-e2e-` resources, skips any
// inside the grace window, and deletes the rest; a missing/unreadable freshness
// tag is treated as stale. See serverless-ci/e2e/spec.md ("Resource Hygiene").

export const TOOL = "cdk";
export const PLATFORM = "lambda";

export const FRESHNESS_TAG_KEY = "one_e2e_created";
export const RUN_ID_TAG_KEY = "one_e2e_run_id";

// Lambda function names are capped at 64 chars; `one-e2e-cdk-lambda-` (19) plus an
// 8-char run id leaves plenty of room.
export const resourceName = (runId: string): string => `one-e2e-${TOOL}-${PLATFORM}-${runId}`;

// Unix-second timestamp for the freshness tag. Passed in by the caller so the value
// is stamped once at creation rather than drifting across re-reads.
export const freshnessTimestamp = (): string => `${Math.floor(Date.now() / 1000)}`;
