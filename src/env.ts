/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "aws-cdk-lib/aws-lambda";
import log from "loglevel";
import { runtimeLookup, RuntimeType } from "./constants";
import { DatadogLambdaProps, DatadogLambdaStrictProps } from "./interfaces";

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

export function setGitEnvironmentVariables(
  lambdas: any[],
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

  // We're using an any type here because AWS does not expose the `environment` field in their type
  lambdas.forEach((lam) => {
    if (lam.environment[DD_TAGS] !== undefined) {
      lam.environment[DD_TAGS].value += `,git.commit.sha:${hash}`;
    } else {
      lam.addEnvironment(DD_TAGS, `git.commit.sha:${hash}`);
    }
    lam.environment[DD_TAGS].value += `,git.repository_url:${gitRepoUrl}`;
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

export function applyEnvVariables(lam: lambda.Function, baseProps: DatadogLambdaStrictProps): void {
  log.debug(`Setting environment variables...`);
  const lam_with_env_vars: any = lam; //cast to any to access the private environment fields like in setGitEnvironmentVariables
  const setEnvIfUndefined = (envVar: string, value: string | boolean) => {
    if (lam_with_env_vars.environment[envVar] === undefined) {
      lam.addEnvironment(envVar, value.toString().toLowerCase());
    }
  };

  //for each env variable, only set to default if it is NOT already set by user
  setEnvIfUndefined(ENABLE_DD_TRACING_ENV_VAR, baseProps.enableDatadogTracing);

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
    setEnvIfUndefined(ENABLE_DD_APPSEC_ENV_VAR, "true");
  } else if (baseProps.datadogAppSecMode === "on" || baseProps.datadogAppSecMode === "extension") {
    setEnvIfUndefined(AWS_LAMBDA_EXEC_WRAPPER_KEY, AWS_LAMBDA_EXEC_WRAPPER_VAL);
    setEnvIfUndefined(ENABLE_DD_SERVERLESS_APPSEC_ENV_VAR, "true");
  }

  setEnvIfUndefined(ENABLE_XRAY_TRACE_MERGING_ENV_VAR, baseProps.enableMergeXrayTraces);

  if (baseProps.extensionLayerVersion || baseProps.extensionLayerArn) {
    setEnvIfUndefined(INJECT_LOG_CONTEXT_ENV_VAR, "false");
  } else {
    setEnvIfUndefined(INJECT_LOG_CONTEXT_ENV_VAR, baseProps.injectLogContext);
  }

  setEnvIfUndefined(ENABLE_DD_LOGS_ENV_VAR, baseProps.enableDatadogLogs);
  setEnvIfUndefined(CAPTURE_LAMBDA_PAYLOAD_ENV_VAR, baseProps.captureLambdaPayload);

  //Cloud Payload Tagging - (baseProps defaults to false aka "$.*" environment variable values)
  const CLOUD_PAYLOAD_TAGGING_VALUE = baseProps.captureCloudServicePayload ? "all" : "$.*";
  setEnvIfUndefined(DD_TRACE_CLOUD_REQUEST_PAYLOAD_TAGGING, CLOUD_PAYLOAD_TAGGING_VALUE);
  setEnvIfUndefined(DD_TRACE_CLOUD_RESPONSE_PAYLOAD_TAGGING, CLOUD_PAYLOAD_TAGGING_VALUE);

  if (baseProps.logLevel) {
    setEnvIfUndefined(LOG_LEVEL_ENV_VAR, baseProps.logLevel);
  }
}

export function setDDEnvVariables(lam: lambda.Function, props: DatadogLambdaProps): void {
  if (props.env) {
    lam.addEnvironment(DD_ENV_ENV_VAR, props.env);
  }
  if (props.service) {
    lam.addEnvironment(DD_SERVICE_ENV_VAR, props.service);
  }
  if (props.version) {
    lam.addEnvironment(DD_VERSION_ENV_VAR, props.version);
  }
  if (props.tags) {
    lam.addEnvironment(DD_TAGS, props.tags);
  }
  if (props.enableColdStartTracing !== undefined) {
    lam.addEnvironment(DD_COLD_START_TRACING, props.enableColdStartTracing.toString().toLowerCase());
  }
  if (props.minColdStartTraceDuration !== undefined) {
    lam.addEnvironment(DD_MIN_COLD_START_DURATION, props.minColdStartTraceDuration.toString().toLowerCase());
  }
  if (props.coldStartTraceSkipLibs !== undefined) {
    lam.addEnvironment(DD_COLD_START_TRACE_SKIP_LIB, props.coldStartTraceSkipLibs);
  }
  if (props.enableProfiling !== undefined) {
    lam.addEnvironment(DD_PROFILING_ENABLED, props.enableProfiling.toString().toLowerCase());
  }
  if (props.encodeAuthorizerContext !== undefined) {
    lam.addEnvironment(DD_ENCODE_AUTHORIZER_CONTEXT, props.encodeAuthorizerContext.toString().toLowerCase());
  }
  if (props.decodeAuthorizerContext !== undefined) {
    lam.addEnvironment(DD_DECODE_AUTHORIZER_CONTEXT, props.decodeAuthorizerContext.toString().toLowerCase());
  }
  if (props.apmFlushDeadline !== undefined) {
    lam.addEnvironment(DD_APM_FLUSH_DEADLINE_MILLISECONDS, props.apmFlushDeadline.toString().toLowerCase());
  }

  if (props.llmObsEnabled !== undefined) {
    lam.addEnvironment(DD_LLMOBS_ENABLED, props.llmObsEnabled.toString().toLowerCase());
  }
  if (props.llmObsMlApp !== undefined) {
    lam.addEnvironment(DD_LLMOBS_ML_APP, props.llmObsMlApp);
  }
  if (props.llmObsAgentlessEnabled !== undefined) {
    lam.addEnvironment(DD_LLMOBS_AGENTLESS_ENABLED, props.llmObsAgentlessEnabled.toString().toLowerCase());
  }
}
