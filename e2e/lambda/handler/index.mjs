/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

// Minimal handler for the e2e workload, duplicated from serverless-self-monitoring
// (lambda-managed-instances/handlers/default/nodejs). The Datadog layer and extension trace the
// invocation and collect this log line, so the handler needs no tracer setup.
export const handler = async () => {
  console.log("hello from the one-e2e cdk lambda workload");

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "ok" }),
  };
};
