/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { Node } from "constructs";
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

// Bookkeeping for env vars this library writes to Lambda functions. aws-cdk-lib does not
// expose Function.environment publicly, so we mirror our own writes here and read from
// this map instead of the private field.
//
// Not exported from index.ts -- internal to the package.
//
// WeakMap so construct nodes can be garbage-collected when their stack goes out of scope
// (for example, between test cases).
//
// Env vars set via func.addEnvironment() outside this library are invisible here and will
// be overwritten if the library writes the same key. Configure DD_* vars via
// DatadogLambdaProps or datadogLambda.setEnvironment(), or call func.addEnvironment()
// after datadogLambda.addLambdaFunctions().
const ddEnvTracker: WeakMap<Node, TrackedEnvironment> = new WeakMap();

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
  const tracked = ddEnvTracker.get(lam.permissionsNode);
  return key === DD_TAGS ? (tracked?.tagsSet ?? false) : (tracked?.values.has(key) ?? false);
}

function getOrCreateTrackedEnvironment(lam: LambdaFunction): TrackedEnvironment {
  let tracked = ddEnvTracker.get(lam.permissionsNode);
  if (!tracked) {
    tracked = {
      values: new Map(),
      propTags: new Map(),
      functionTags: new Map(),
      gitTags: new Map(),
      tagsSet: false,
    };
    ddEnvTracker.set(lam.permissionsNode, tracked);
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
