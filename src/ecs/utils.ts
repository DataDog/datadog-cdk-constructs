/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as ecs from "aws-cdk-lib/aws-ecs";
import log from "loglevel";
import { DatadogECSFargateProps } from "./fargate/interfaces";
import { DatadogECSBaseProps } from "./interfaces";

export function mergeFargateProps(
  lowerPrecedence: DatadogECSFargateProps,
  higherPrecedence: DatadogECSFargateProps,
): DatadogECSFargateProps {
  const newProps = { ...lowerPrecedence, ...higherPrecedence };
  newProps.logDriverConfiguration = {
    ...lowerPrecedence.logDriverConfiguration,
    ...higherPrecedence.logDriverConfiguration,
  };
  return newProps;
}

export function validateECSProps(props: DatadogECSBaseProps): void {
  log.debug("Validating props...");

  if (process.env.DD_CDK_BYPASS_SITE_VALIDATION) {
    log.debug("Bypassing site validation...");
    return;
  }

  const siteList: string[] = [
    "datadoghq.com",
    "datadoghq.eu",
    "us3.datadoghq.com",
    "us5.datadoghq.com",
    "ap1.datadoghq.com",
    "ddog-gov.com",
  ];
  if (
    props.site !== undefined &&
    !siteList.includes(props.site.toLowerCase()) &&
    !(props.site.startsWith("${Token[") && props.site.endsWith("]}")) &&
    !process.env.DD_CDK_BYPASS_SITE_VALIDATION
  ) {
    throw new Error(
      "Warning: Invalid site URL. Must be either datadoghq.com, datadoghq.eu, us3.datadoghq.com, us5.datadoghq.com, ap1.datadoghq.com, or ddog-gov.com.",
    );
  }

  // Agent configuration validation
  if (props.registry === undefined) {
    throw new Error("The `registry` property must be defined.");
  }
  if (props.imageVersion === undefined) {
    throw new Error("The `version` property must be defined.");
  }

  // Health check validation
  if (props.isHealthCheckEnabled && props.datadogHealthCheck === undefined) {
    throw new Error("The `datadogHealthCheck` property must be defined when `isHealthCheckEnabled` is true.");
  }
  if (props.isHealthCheckEnabled && props.datadogHealthCheck!.command === undefined) {
    throw new Error("The `command` property must be defined in `datadogHealthCheck`.");
  }

  // App Sec requires tracing
  if (props.enableASM && !props.enableAPM) {
    throw new Error("When `enableDatadogASM` is enabled, `enableDatadogTracing` must also be enabled.");
  }

  // USM requires env, service, and version tags
  if (props.enableUSM && (!props.env || !props.service || !props.version)) {
    throw new Error("When `enableUSM` is enabled, `env`, `service`, and `version` must be defined.");
  }
}

export function isOperatingSystemLinux(task: ecs.TaskDefinition): boolean {
  const cfnTaskDef = task.node.defaultChild as ecs.CfnTaskDefinition;
  const runtimePlatform = cfnTaskDef.runtimePlatform as ecs.CfnTaskDefinition.RuntimePlatformProperty;

  if (runtimePlatform === undefined) {
    // TODO: verify assumption if undefined OS, then Linux on Amazon ECS Fargate
    return true;
  }

  if (runtimePlatform.operatingSystemFamily === undefined) {
    return true;
  }

  return runtimePlatform.operatingSystemFamily === "LINUX";
}

export function isOperatingSystemLinuxV2(props: ecs.FargateTaskDefinitionProps): boolean {
  if (props.runtimePlatform === undefined) {
    return true;
  }

  if (props.runtimePlatform.operatingSystemFamily === undefined) {
    return true;
  }

  return props.runtimePlatform.operatingSystemFamily.isLinux();
}
