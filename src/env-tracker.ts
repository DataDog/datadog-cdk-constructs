/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { LambdaFunction } from "./interfaces";

const DD_TAGS = "DD_TAGS";

type Tags = Map<string, string>;

interface TrackedEnvironment {
  readonly values: Map<string, string>;
  readonly propTags: Tags;
  readonly functionTags: Tags;
  readonly gitTags: Tags;
  tagsSet: boolean;
}

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
const ddEnvTracker: WeakMap<LambdaFunction, TrackedEnvironment> = new WeakMap();

export function setTrackedEnv(lam: LambdaFunction, key: string, value: string): void {
  if (key === DD_TAGS) {
    const tracked = getOrCreateTrackedEnvironment(lam);
    replaceTags(tracked.functionTags, value);
    writeTags(lam, tracked);
    return;
  }

  getOrCreateTrackedEnvironment(lam).values.set(key, value);
  lam.addEnvironment(key, value);
}

export function setTrackedPropTags(lam: LambdaFunction, value: string): void {
  const tracked = getOrCreateTrackedEnvironment(lam);
  replaceTags(tracked.propTags, value);
  writeTags(lam, tracked);
}

export function mergeTrackedGitTags(lam: LambdaFunction, value: string): void {
  const tracked = getOrCreateTrackedEnvironment(lam);
  mergeTags(tracked.gitTags, value);
  writeTags(lam, tracked);
}

export function hasTrackedEnv(lam: LambdaFunction, key: string): boolean {
  const tracked = ddEnvTracker.get(lam);
  return key === DD_TAGS ? (tracked?.tagsSet ?? false) : (tracked?.values.has(key) ?? false);
}

function getOrCreateTrackedEnvironment(lam: LambdaFunction): TrackedEnvironment {
  let tracked = ddEnvTracker.get(lam);
  if (!tracked) {
    tracked = {
      values: new Map(),
      propTags: new Map(),
      functionTags: new Map(),
      gitTags: new Map(),
      tagsSet: false,
    };
    ddEnvTracker.set(lam, tracked);
  }
  return tracked;
}

function replaceTags(tags: Tags, value: string): void {
  tags.clear();
  mergeTags(tags, value);
}

function mergeTags(tags: Tags, value: string): void {
  for (const tag of value.split(",")) {
    // Split only the key because tag values can contain colons.
    const separator = tag.indexOf(":");
    const key = separator > 0 ? tag.slice(0, separator) : tag;
    tags.delete(key);
    tags.set(key, tag);
  }
}

function writeTags(lam: LambdaFunction, tracked: TrackedEnvironment): void {
  tracked.tagsSet = true;
  lam.addEnvironment(DD_TAGS, serializeTags(tracked));
}

function serializeTags(tracked: TrackedEnvironment): string {
  const tags: Tags = new Map();
  for (const source of [tracked.propTags, tracked.functionTags, tracked.gitTags]) {
    for (const [key, tag] of source) {
      // Move replaced tags to the position of the higher-precedence source.
      tags.delete(key);
      tags.set(key, tag);
    }
  }
  return [...tags.values()].join(",");
}
