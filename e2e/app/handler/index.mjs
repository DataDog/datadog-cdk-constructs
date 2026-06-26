/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

// Minimal hello-world handler for the e2e workload, duplicated from
// serverless-self-monitoring (lambda-managed-instances/handlers/default/nodejs).
// It just emits a log line and returns 200 -- tracing is auto-injected and logs
// are auto-collected by the Datadog Lambda layer + extension, so no tracer setup
// is needed here. The DD_TAGS-provided run id appears on the resulting telemetry.
export const handler = async () => {
  console.log(`hello from one-e2e cdk lambda workload (run ${process.env.E2E_RUN_ID ?? "unknown"})`);

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "ok" }),
  };
};
