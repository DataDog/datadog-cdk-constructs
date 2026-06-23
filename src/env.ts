/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import log from "loglevel";
import { runtimeLookup, RuntimeType } from "./constants";
import { DatadogLambdaProps, DatadogLambdaStrictProps, LambdaFunction } from "./interfaces";

export const AWS_LAMBDA_EXEC_WRAPPER_KEY = "AWS_LAMBDA_EXEC_WRAPPER";
export const AWS_LAMBDA_EXEC_WRAPPER_VAL = "/opt/datadog_wrapper";

export const ENABLE_DD_TRACING_ENV_VAR = "DD_TRACE_ENABLED";
export const ENABLE_DD_SERVERLESS_APPSEC_ENV_VAR = "DD_SERVERLESS_APPSEC_ENABLED";
export const ENABLE_DD_APPSEC_ENV_VAR = "DD_APPSEC_ENABLED";
export const ENABLE_XRAY_TRACE_MERGING_ENV_VAR = "DD_MERGE_XRAY_TRACES";
export const INJECT_LOG_CONTEXT_ENV_VAR = "DD_LOGS_INJECTION";
export const LOG_LEVEL_ENV_VAR = "DD_LOG_LEVEL";
export const ENABLE_DD_LOGS_ENV_VAR = "DD_SERVERLESS_LOGS_ENABLED";
export const CAPTURE_LAMBDA_PAYLOAD_ENV_VAR = "DD_CAPTURE_LAMBDA_PAYLOAD";
export const DD_TRACE_CLOUD_REQUEST_PAYLOAD_TAGGING = "DD_TRACE_CLOUD_REQUEST_PAYLOAD_TAGGING";
export const DD_TRACE_CLOUD_RESPONSE_PAYLOAD_TAGGING = "DD_TRACE_CLOUD_RESPONSE_PAYLOAD_TAGGING";
export const DD_ENV_ENV_VAR = "DD_ENV";
export const DD_SERVICE_ENV_VAR = "DD_SERVICE";
export const DD_VERSION_ENV_VAR = "DD_VERSION";
export const DD_TAGS = "DD_TAGS";
export const DD_COLD_START_TRACING = "DD_COLD_START_TRACING";
export const DD_MIN_COLD_START_DURATION = "DD_MIN_COLD_START_DURATION";
export const DD_COLD_START_TRACE_SKIP_LIB = "DD_COLD_START_TRACE_SKIP_LIB";
export const DD_PROFILING_ENABLED = "DD_PROFILING_ENABLED";
export const DD_ENCODE_AUTHORIZER_CONTEXT = "DD_ENCODE_AUTHORIZER_CONTEXT";
export const DD_DECODE_AUTHORIZER_CONTEXT = "DD_DECODE_AUTHORIZER_CONTEXT";
export const DD_APM_FLUSH_DEADLINE_MILLISECONDS = "DD_APM_FLUSH_DEADLINE_MILLISECONDS";
export const DD_LLMOBS_ENABLED = "DD_LLMOBS_ENABLED";
export const DD_LLMOBS_ML_APP = "DD_LLMOBS_ML_APP";
export const DD_LLMOBS_AGENTLESS_ENABLED = "DD_LLMOBS_AGENTLESS_ENABLED";

const execSync = require("child_process").execSync;

const URL = require("url").URL;

// Tracks env vars written by this library per Function, so we can read them back without
// touching aws-cdk-lib's private Function.environment field. aws-cdk-lib has no public
// read accessor for env vars — the WeakMap is the library's own bookkeeping only.
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

export function setGitEnvironmentVariables(
  lambdas: LambdaFunction[],
  gitCommitShaOverride?: string | undefined,
  gitRepoUrlOverride?: string | undefined,
): void {
  log.debug("Adding source code integration...");
  let { hash, gitRepoUrl } = getGitData();
  if (gitCommitShaOverride) {
    log.debug(`Using git SHA override.  Will be ${gitCommitShaOverride} instead of ${hash}`);
    hash = gitCommitShaOverride;
  }
  if (gitRepoUrlOverride) {
    log.debug(`Using git repo URL override.  Will be ${gitRepoUrlOverride} instead of ${hash}`);
    gitRepoUrl = gitRepoUrlOverride;
  }

  if (hash == "" || gitRepoUrl == "") return;

  const tagsValue = `git.commit.sha:${hash},git.repository_url:${gitRepoUrl}`;
  lambdas.forEach((lam) => {
    const existingTagValue = getTrackedEnv(lam, DD_TAGS);
    const finalTagValue = existingTagValue ? `${existingTagValue},${tagsValue}` : tagsValue;
    setTrackedEnv(lam, DD_TAGS, finalTagValue);
  });
}

function getGitData(): { hash: string; gitRepoUrl: string } {
  let hash: string;
  let gitRepoUrl: string;

  try {
    hash = execSync("git rev-parse HEAD").toString().trim();
    gitRepoUrl = execSync("git config --get remote.origin.url").toString().trim();
  } catch (e) {
    log.debug(`Failed to add source code integration. Error: ${e}`);
    return { hash: "", gitRepoUrl: "" };
  }
  return { hash, gitRepoUrl: filterAndFormatGitRemote(gitRepoUrl) };
}

// Removes sensitive info from the given git remote url and normalizes the url prefix.
// "git@github.com:" and "https://github.com/" prefixes will be normalized into "github.com/"
export function filterAndFormatGitRemote(rawRemote: string): string {
  rawRemote = filterSensitiveInfoFromRepository(rawRemote);
  if (!rawRemote) {
    return rawRemote;
  }
  rawRemote = rawRemote
    .replace(/git@(github\.com|gitlab\.com):/, "$1/")
    .replace(/https:\/\/(github\.com|gitlab\.com)\//, "$1/");

  return rawRemote;
}

function filterSensitiveInfoFromRepository(repositoryUrl: string): string {
  try {
    if (!repositoryUrl) {
      return repositoryUrl;
    }
    if (repositoryUrl.startsWith("git@")) {
      return repositoryUrl;
    }
    const { protocol, hostname, pathname } = new URL(repositoryUrl);
    if (!protocol || !hostname) {
      return repositoryUrl;
    }

    return `${protocol}//${hostname}${pathname}`;
  } catch (e) {
    return repositoryUrl;
  }
}

export function applyEnvVariables(lam: LambdaFunction, baseProps: DatadogLambdaStrictProps): void {
  log.debug(`Setting environment variables...`);

  const setEnvIfUnset = (envVar: string, value: string | boolean) => {
    if (!hasTrackedEnv(lam, envVar)) {
      setTrackedEnv(lam, envVar, value.toString().toLowerCase());
    }
  };

  setEnvIfUnset(ENABLE_DD_TRACING_ENV_VAR, baseProps.enableDatadogTracing);

  const runtimeType = runtimeLookup[lam.runtime.name];

  if (baseProps.datadogAppSecMode === "tracer" && runtimeType !== RuntimeType.PYTHON) {
    throw new Error(
      `\`datadogAppSecMode\` is set to \`tracer\`. This requires the function to be a Python runtime. Found: ${runtimeType}`,
    );
  }

  if (
    (baseProps.datadogAppSecMode === "on" &&
      runtimeType === RuntimeType.PYTHON &&
      baseProps.pythonLayerVersion &&
      baseProps.pythonLayerVersion >= 114) ||
    baseProps.datadogAppSecMode === "tracer"
  ) {
    setEnvIfUnset(ENABLE_DD_APPSEC_ENV_VAR, "true");
  } else if (baseProps.datadogAppSecMode === "on" || baseProps.datadogAppSecMode === "extension") {
    setEnvIfUnset(AWS_LAMBDA_EXEC_WRAPPER_KEY, AWS_LAMBDA_EXEC_WRAPPER_VAL);
    setEnvIfUnset(ENABLE_DD_SERVERLESS_APPSEC_ENV_VAR, "true");
  }

  setEnvIfUnset(ENABLE_XRAY_TRACE_MERGING_ENV_VAR, baseProps.enableMergeXrayTraces);

  if (baseProps.extensionLayerVersion || baseProps.extensionLayerArn) {
    setEnvIfUnset(INJECT_LOG_CONTEXT_ENV_VAR, "false");
  } else {
    setEnvIfUnset(INJECT_LOG_CONTEXT_ENV_VAR, baseProps.injectLogContext);
  }

  setEnvIfUnset(ENABLE_DD_LOGS_ENV_VAR, baseProps.enableDatadogLogs);
  setEnvIfUnset(CAPTURE_LAMBDA_PAYLOAD_ENV_VAR, baseProps.captureLambdaPayload);

  const CLOUD_PAYLOAD_TAGGING_VALUE = baseProps.captureCloudServicePayload ? "all" : "";
  setEnvIfUnset(DD_TRACE_CLOUD_REQUEST_PAYLOAD_TAGGING, CLOUD_PAYLOAD_TAGGING_VALUE);
  setEnvIfUnset(DD_TRACE_CLOUD_RESPONSE_PAYLOAD_TAGGING, CLOUD_PAYLOAD_TAGGING_VALUE);

  if (baseProps.logLevel) {
    setEnvIfUnset(LOG_LEVEL_ENV_VAR, baseProps.logLevel);
  }
}

export function setDDEnvVariables(lam: LambdaFunction, props: DatadogLambdaProps): void {
  if (props.env) {
    setTrackedEnv(lam, DD_ENV_ENV_VAR, props.env);
  }
  if (props.service) {
    setTrackedEnv(lam, DD_SERVICE_ENV_VAR, props.service);
  }
  if (props.version) {
    setTrackedEnv(lam, DD_VERSION_ENV_VAR, props.version);
  }
  if (props.tags) {
    setTrackedEnv(lam, DD_TAGS, props.tags);
  }
  if (props.enableColdStartTracing !== undefined) {
    setTrackedEnv(lam, DD_COLD_START_TRACING, props.enableColdStartTracing.toString().toLowerCase());
  }
  if (props.minColdStartTraceDuration !== undefined) {
    setTrackedEnv(lam, DD_MIN_COLD_START_DURATION, props.minColdStartTraceDuration.toString().toLowerCase());
  }
  if (props.coldStartTraceSkipLibs !== undefined) {
    setTrackedEnv(lam, DD_COLD_START_TRACE_SKIP_LIB, props.coldStartTraceSkipLibs);
  }
  if (props.enableProfiling !== undefined) {
    setTrackedEnv(lam, DD_PROFILING_ENABLED, props.enableProfiling.toString().toLowerCase());
  }
  if (props.encodeAuthorizerContext !== undefined) {
    setTrackedEnv(lam, DD_ENCODE_AUTHORIZER_CONTEXT, props.encodeAuthorizerContext.toString().toLowerCase());
  }
  if (props.decodeAuthorizerContext !== undefined) {
    setTrackedEnv(lam, DD_DECODE_AUTHORIZER_CONTEXT, props.decodeAuthorizerContext.toString().toLowerCase());
  }
  if (props.apmFlushDeadline !== undefined) {
    setTrackedEnv(lam, DD_APM_FLUSH_DEADLINE_MILLISECONDS, props.apmFlushDeadline.toString().toLowerCase());
  }

  if (props.llmObsEnabled !== undefined) {
    setTrackedEnv(lam, DD_LLMOBS_ENABLED, props.llmObsEnabled.toString().toLowerCase());
  }
  if (props.llmObsMlApp !== undefined) {
    setTrackedEnv(lam, DD_LLMOBS_ML_APP, props.llmObsMlApp);
  }
  if (props.llmObsAgentlessEnabled !== undefined) {
    setTrackedEnv(lam, DD_LLMOBS_AGENTLESS_ENABLED, props.llmObsAgentlessEnabled.toString().toLowerCase());
  }
}
