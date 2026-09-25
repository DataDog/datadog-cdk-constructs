/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import { Token } from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import {
  DefaultTracerVersion,
  SingleLanguageInjectionModeTag,
  TracerImageRegistry,
  TracerMountPath,
} from "./constants";
import { APMInstrumentationConfig, TracerLanguage, TracerLibc } from "./interfaces";

type EnvSeparator = " " | ":" | ",";

/**
 * A value added to a variable the container may already set. `separator` bounds each entry, so only
 * an exact entry counts as the tracer's. `preserveLeadingEmpty` keeps the default entry of path
 * lists such as `PHP_INI_SCAN_DIR`. `maxLength` limits the merged value in bytes.
 */
interface PositionedEnvFragment {
  readonly name: string;
  readonly value: string;
  readonly mode: "append" | "prepend";
  readonly separator: EnvSeparator;
  readonly preserveLeadingEmpty?: boolean;
  readonly maxLength?: number;
}

/**
 * A value set only when the container leaves the variable unset or empty.
 */
interface ScalarEnvFragment {
  readonly name: string;
  readonly value: string;
  readonly mode: "set-if-absent";
}

export type EnvFragment = PositionedEnvFragment | ScalarEnvFragment;

interface LanguageSpec {
  /**
   * Language segment of the `dd-lib-<language>-init` tracer image name.
   */
  readonly imageLanguage: string;
  readonly env: (libc: TracerLibc) => EnvFragment[];
}

const LanguageSpecs: Record<TracerLanguage, LanguageSpec> = {
  [TracerLanguage.JAVA]: {
    imageLanguage: "java",
    env: () => [
      {
        name: "JAVA_TOOL_OPTIONS",
        value: `-javaagent:${TracerMountPath}/dd-java-agent.jar -XX:+IgnoreUnrecognizedVMOptions`,
        mode: "append",
        separator: " ",
      },
    ],
  },
  [TracerLanguage.NODEJS]: {
    imageLanguage: "js",
    env: () => [
      {
        name: "NODE_OPTIONS",
        value: `--require ${TracerMountPath}/node_modules/dd-trace/init.js`,
        mode: "append",
        separator: " ",
      },
    ],
  },
  [TracerLanguage.DOTNET]: {
    imageLanguage: "dotnet",
    env: () => [
      { name: "CORECLR_ENABLE_PROFILING", value: "1", mode: "set-if-absent" },
      { name: "CORECLR_PROFILER", value: "{846F5F1C-F9AE-4B07-969E-05C26BC060D8}", mode: "set-if-absent" },
      {
        name: "CORECLR_PROFILER_PATH",
        value: `${TracerMountPath}/Datadog.Trace.ClrProfiler.Native.so`,
        mode: "set-if-absent",
      },
      { name: "DD_DOTNET_TRACER_HOME", value: TracerMountPath, mode: "set-if-absent" },
      {
        name: "LD_PRELOAD",
        value: `${TracerMountPath}/continuousprofiler/Datadog.Linux.ApiWrapper.x64.so`,
        mode: "prepend",
        separator: " ",
        maxLength: 1024,
      },
    ],
  },
  [TracerLanguage.PYTHON]: {
    imageLanguage: "python",
    env: () => [{ name: "PYTHONPATH", value: TracerMountPath, mode: "append", separator: ":" }],
  },
  [TracerLanguage.RUBY]: {
    imageLanguage: "ruby",
    env: () => [{ name: "RUBYOPT", value: `-r${TracerMountPath}/auto_inject`, mode: "prepend", separator: " " }],
  },
  [TracerLanguage.PHP]: {
    imageLanguage: "php",
    env: (libc) => {
      const loader = `${TracerMountPath}/${libc === TracerLibc.MUSL ? "linux-musl" : "linux-gnu"}/loader`;
      return [
        { name: "PHP_INI_SCAN_DIR", value: loader, mode: "append", separator: ":", preserveLeadingEmpty: true },
        { name: "DD_LOADER_PACKAGE_PATH", value: TracerMountPath, mode: "set-if-absent" },
      ];
    },
  },
};

const InjectionModeTagFragment: EnvFragment = {
  name: "DD_TAGS",
  value: SingleLanguageInjectionModeTag,
  mode: "prepend",
  separator: ",",
};

/**
 * The tracer image for the configured language and version.
 */
export function getTracerImage(config: APMInstrumentationConfig): string {
  const version = config.tracerVersion ?? DefaultTracerVersion;
  return `${TracerImageRegistry}/dd-lib-${LanguageSpecs[config.language].imageLanguage}-init:${version}`;
}

/**
 * The environment fragments that load the tracer in an application container.
 */
export function getLanguageFragments(config: APMInstrumentationConfig): EnvFragment[] {
  return LanguageSpecs[config.language].env(config.tracerLibc ?? TracerLibc.GLIBC);
}

/**
 * The environment fragments added to the application container: the tracer's, and the tag
 * recording the injection mode.
 */
export function getInjectionFragments(config: APMInstrumentationConfig): EnvFragment[] {
  return [...getLanguageFragments(config), InjectionModeTagFragment];
}

/**
 * The container's environment with every fragment merged into the values it already sets.
 */
export function mergeInjectionEnvironment(
  containerName: string,
  props: ecs.ContainerDefinitionOptions,
  fragments: EnvFragment[],
): Record<string, string> {
  const environment = { ...props.environment };
  for (const fragment of fragments) {
    if (props.secrets?.[fragment.name] !== undefined) {
      throw new Error(
        `Cannot add the tracer to container ${containerName} because ${fragment.name} comes from a secret. Set ${fragment.name} in \`environment\` instead, or remove it.`,
      );
    }
    environment[fragment.name] = mergeEnvFragment(containerName, environment[fragment.name], fragment);
  }
  return environment;
}

/**
 * Places one copy of the fragment in the current value, keeping every other entry.
 */
export function mergeEnvFragment(containerName: string, current: string | undefined, fragment: EnvFragment): string {
  const isDeployTimeValue = current !== undefined && Token.isUnresolved(current);

  if (fragment.mode === "set-if-absent") {
    if (isDeployTimeValue) {
      throw new Error(
        `Cannot add the tracer to container ${containerName} because ${fragment.name} is only known at deployment. Set ${fragment.name} to ${JSON.stringify(fragment.value)}, or remove it.`,
      );
    }
    if (current && current !== fragment.value) {
      throw new Error(
        `Cannot add the tracer to container ${containerName} because ${fragment.name} is set to ${JSON.stringify(
          current,
        )} instead of ${JSON.stringify(fragment.value)}. Remove ${fragment.name}, or install the tracer in the application image.`,
      );
    }
    return fragment.value;
  }

  // A value only known at deployment can't be searched for an existing entry or measured
  if (isDeployTimeValue) {
    return joinFragment(current, fragment);
  }

  const remaining = current ? removeFragment(current, fragment) : "";
  const merged = remaining
    ? joinFragment(remaining, fragment)
    : `${fragment.preserveLeadingEmpty ? fragment.separator : ""}${fragment.value}`;
  if (fragment.maxLength !== undefined && Buffer.byteLength(merged) > fragment.maxLength) {
    throw new Error(
      `Cannot add the tracer to container ${containerName} because ${fragment.name} would exceed ${fragment.maxLength} bytes. Shorten ${fragment.name}.`,
    );
  }
  return merged;
}

/**
 * Whether the value carries the fragment as an exact entry.
 */
export function hasEnvFragment(value: string | undefined, fragment: EnvFragment): boolean {
  if (value === undefined) {
    return false;
  }
  return fragment.mode === "set-if-absent" ? value === fragment.value : findFragment(value, fragment).length > 0;
}

function joinFragment(value: string, fragment: PositionedEnvFragment): string {
  return fragment.mode === "append"
    ? `${value}${fragment.separator}${fragment.value}`
    : `${fragment.value}${fragment.separator}${value}`;
}

type Range = [start: number, end: number];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Where each exact entry of the fragment starts and ends in the value.
 */
function findFragment(value: string, fragment: PositionedEnvFragment): Range[] {
  const separator = escapeRegExp(fragment.separator);
  const pattern = new RegExp(`(^|${separator})(${escapeRegExp(fragment.value)})(?=${separator}|$)`, "g");
  return [...value.matchAll(pattern)].map((match): Range => {
    const start = match.index! + match[1].length;
    return [start, start + fragment.value.length];
  });
}

/**
 * The value without any exact entry of the fragment, or the separators joining them to the rest.
 */
function removeFragment(value: string, fragment: PositionedEnvFragment): string {
  const runs = mergeRanges(findFragment(value, fragment), fragment.separator.length);
  const ranges = mergeRanges(runs.map((range) => expandRange(value, fragment, range)));

  let result = "";
  let cursor = 0;
  for (const [start, end] of ranges) {
    result += value.slice(cursor, start);
    cursor = end;
  }
  return result + value.slice(cursor);
}

/**
 * Joins ascending ranges that overlap or sit at most `maxGap` characters apart.
 */
function mergeRanges(ranges: Range[], maxGap = 0): Range[] {
  const merged: Range[] = [];
  for (const [start, end] of ranges) {
    const previous = merged[merged.length - 1];
    if (previous !== undefined && start <= previous[1] + maxGap) {
      previous[1] = Math.max(previous[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}

/**
 * Widens a range by one adjacent separator: the one before an appended entry or after a prepended
 * one, falling back to the other side at the edges of the value.
 */
function expandRange(value: string, fragment: PositionedEnvFragment, [start, end]: Range): Range {
  const before = start > 0 && value[start - 1] === fragment.separator;
  const after = end < value.length && value[end] === fragment.separator;
  if (fragment.mode === "append") {
    if (before) {
      return [start - 1, end];
    }
    if (after) {
      return [start, end + 1];
    }
  } else {
    if (after) {
      return [start, end + 1];
    }
    if (before) {
      return [start - 1, end];
    }
  }
  return [start, end];
}
