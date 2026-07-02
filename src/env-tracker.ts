/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { LambdaFunction } from "./interfaces";

// Tracks env vars written by this library per Function, so we can read them back without
// touching aws-cdk-lib's private Function.environment field. aws-cdk-lib has no public
// read accessor for env vars, so the WeakMap is the library's own bookkeeping only.
//
// This module is intentionally not re-exported from index.ts: the helpers are internal
// and not part of the package's public API.
//
// WeakMap (vs Map) so Function objects can be garbage-collected when a stack goes out of
// scope (e.g. between test cases) without this module holding a lingering reference.
//
// Note: env vars set on a Function via func.addEnvironment() outside of this library
// are not tracked here and will be overridden if the library sets the same key.
// Configure DD_* vars via DatadogLambdaProps, or call func.addEnvironment() after
// calling addLambdaFunctions().
const ddEnvTracker: WeakMap<LambdaFunction, Map<string, string>> = new WeakMap();

export function setTrackedEnv(lam: LambdaFunction, key: string, value: string): void {
  let envMap = ddEnvTracker.get(lam);
  if (!envMap) {
    envMap = new Map();
    ddEnvTracker.set(lam, envMap);
  }
  envMap.set(key, value);
  lam.addEnvironment(key, value);
}

export function getTrackedEnv(lam: LambdaFunction, key: string): string | undefined {
  return ddEnvTracker.get(lam)?.get(key);
}

export function hasTrackedEnv(lam: LambdaFunction, key: string): boolean {
  return ddEnvTracker.get(lam)?.has(key) ?? false;
}
