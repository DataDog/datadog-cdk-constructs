/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import log from "loglevel";
import { DatadogProps, DatadogStrictProps, ILambdaFunction } from "./interfaces";

export const ENABLE_DD_TRACING_ENV_VAR = "DD_TRACE_ENABLED";
export const ENABLE_XRAY_TRACE_MERGING_ENV_VAR = "DD_MERGE_XRAY_TRACES";
export const INJECT_LOG_CONTEXT_ENV_VAR = "DD_LOGS_INJECTION";
export const LOG_LEVEL_ENV_VAR = "DD_LOG_LEVEL";
export const ENABLE_DD_LOGS_ENV_VAR = "DD_SERVERLESS_LOGS_ENABLED";
export const CAPTURE_LAMBDA_PAYLOAD_ENV_VAR = "DD_CAPTURE_LAMBDA_PAYLOAD";
export const DD_ENV_ENV_VAR = "DD_ENV";
export const DD_SERVICE_ENV_VAR = "DD_SERVICE";
export const DD_VERSION_ENV_VAR = "DD_VERSION";
export const DD_TAGS = "DD_TAGS";

export function setGitCommitEnvironmentVariables(lambdas: any[], hash: string, gitRepoUrl: string | undefined) {
  // We're using an any type here because AWS does not expose the `environment` field in their type
  lambdas.forEach((lambda) => {
    if (lambda.environment[DD_TAGS] !== undefined) {
      lambda.environment[DD_TAGS].value += `,git.commit.sha:${hash}`;
    } else {
      lambda.addEnvironment(DD_TAGS, `git.commit.sha:${hash}`);
    }
    if (gitRepoUrl) {
      lambda.environment[DD_TAGS].value += `,git.repository_url:${gitRepoUrl}`;
    }
  });
}

export function applyEnvVariables(lambdas: ILambdaFunction[], baseProps: DatadogStrictProps) {
  log.debug(`Setting environment variables...`);
  lambdas.forEach((lam) => {
    lam.addEnvironment(ENABLE_DD_TRACING_ENV_VAR, baseProps.enableDatadogTracing.toString().toLowerCase());
    lam.addEnvironment(ENABLE_XRAY_TRACE_MERGING_ENV_VAR, baseProps.enableMergeXrayTraces.toString().toLowerCase());
    lam.addEnvironment(INJECT_LOG_CONTEXT_ENV_VAR, baseProps.injectLogContext.toString().toLowerCase());
    lam.addEnvironment(ENABLE_DD_LOGS_ENV_VAR, baseProps.enableDatadogLogs.toString().toLowerCase());
    lam.addEnvironment(CAPTURE_LAMBDA_PAYLOAD_ENV_VAR, baseProps.captureLambdaPayload.toString().toLowerCase());
    if (baseProps.logLevel) {
      lam.addEnvironment(LOG_LEVEL_ENV_VAR, baseProps.logLevel);
    }
  });
}

export function setDDEnvVariables(lambdas: ILambdaFunction[], props: DatadogProps) {
  lambdas.forEach((lam) => {
    if (props.extensionLayerVersion) {
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
    }
  });
}
