/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

import { readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";

// Local, gitignored settings such as the AWS_ECS_* resource variables. Variables already set in
// the environment take precedence.
const localEnv = (): Record<string, string> => {
  let contents: string;
  try {
    contents = readFileSync("e2e/.env.local", "utf8");
  } catch {
    return {};
  }

  const env: Record<string, string> = {};
  for (const line of contents.split("\n")) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)$/);
    if (match && process.env[match[1]] === undefined) {
      env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
    }
  }
  return env;
};

export default defineConfig({
  test: {
    include: ["e2e/**/*.test.ts"],
    env: localEnv(),
    // Each suite is one ordered lifecycle sharing a single deployed stack, so it must run serially.
    fileParallelism: false,
    sequence: { concurrent: false },
    hookTimeout: 900_000,
    testTimeout: 900_000,
    // Real cloud deploys are slow; never let a hung step wedge CI past its budget.
    teardownTimeout: 900_000,
  },
});
