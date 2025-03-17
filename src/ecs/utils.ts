/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import log from "loglevel";
import { siteList } from "./constants";
import { DatadogECSBaseProps } from "./interfaces";

/**
 * Verifies that the provided props are valid for the Datadog ECS construct.
 */
export function validateECSBaseProps(props: DatadogECSBaseProps): void {
  if (process.env.DD_CDK_BYPASS_VALIDATION) {
    log.debug("Bypassing props validation...");
    return;
  }

  // Valid site URL
  if (
    props.site !== undefined &&
    !siteList.includes(props.site.toLowerCase()) &&
    !(props.site.startsWith("${Token[") && props.site.endsWith("]}"))
  ) {
    throw new Error(`Warning: Invalid site URL. Must be one of: ${siteList.join(", ")}.`);
  }

  // Agent feature configurations must all be defined
  if (props.dogstatsd === undefined) {
    throw new Error("The `dogstatsd` property must be defined.");
  }
  if (props.apm === undefined) {
    throw new Error("The `apm` property must be defined.");
  }
  if (props.cws === undefined) {
    throw new Error("The `cws` property must be defined.");
  }

  // Agent container configuration validation
  if (props.registry === undefined) {
    throw new Error("The `registry` property must be defined.");
  }
  if (props.imageVersion === undefined) {
    throw new Error("The `version` property must be defined.");
  }

  // Health check validation
  if (props.isDatadogDependencyEnabled && props.datadogHealthCheck === undefined) {
    throw new Error("The `datadogHealthCheck` property must be defined when `isDatadogDependencyEnabled` is true.");
  }
  if (props.isDatadogDependencyEnabled && props.datadogHealthCheck!.command === undefined) {
    throw new Error("The `command` property must be defined in `datadogHealthCheck`.");
  }
}

export function isOperatingSystemLinux(props: ecs.FargateTaskDefinitionProps): boolean {
  if (props.runtimePlatform === undefined) {
    return true;
  }

  if (props.runtimePlatform.operatingSystemFamily === undefined) {
    return true;
  }

  return props.runtimePlatform.operatingSystemFamily.isLinux();
}

export function configureEcsPolicies(task: ecs.TaskDefinition) {
  task.addToTaskRolePolicy(
    new iam.PolicyStatement({
      actions: ["ecs:ListClusters", "ecs:ListContainerInstances", "ecs:DescribeContainerInstances"],
      resources: ["*"],
    }),
  );
}

export function getSecretApiKey(scope: Construct, props: DatadogECSBaseProps): ecs.Secret | undefined {
  if (props.apiKeySecret) {
    return ecs.Secret.fromSecretsManager(props.apiKeySecret);
  } else if (props.apiKeySecretArn) {
    const secret = secretsmanager.Secret.fromSecretCompleteArn(scope, "DatadogSecret", props.apiKeySecretArn);
    return ecs.Secret.fromSecretsManager(secret);
  } else {
    return undefined;
  }
}
