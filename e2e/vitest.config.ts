/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    // The lifecycle is one ordered chain (apply -> trigger -> re-apply -> remove)
    // sharing a single deployed function, so it must run serially.
    fileParallelism: false,
    sequence: { concurrent: false },
    hookTimeout: 900_000,
    testTimeout: 900_000,
    // Real cloud deploys are slow; never let a hung step wedge CI past its budget.
    teardownTimeout: 900_000,
  },
});
