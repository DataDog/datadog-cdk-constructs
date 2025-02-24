/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { Duration } from "aws-cdk-lib";
import { DatadogECSFargateLogDriverProps, DatadogECSFargateProps } from "./interfaces";
import { DatadogEcsBaseDefaultProps } from "../constants";

/**
 * Default log driver configuration for ECS Fargate
 */
export const DatadogECSFargateLogDriverDefaultProps: DatadogECSFargateLogDriverProps = {
  hostEndpoint: "http-intake.logs.datadoghq.com",
  registry: "public.ecr.aws/aws-observability/aws-for-fluent-bit",
  imageVersion: "stable",
};

/**
 * Default environment variables for the Agent in Fargate Tasks
 */
export const FargateDefaultEnvVars = {
  DD_ECS_TASK_COLLECTION_ENABLED: "true",
  ECS_FARGATE: "true",
};

/**
 * Default props for the Datadog ECS Fargate construct
 */
export const DatadogEcsFargateDefaultProps: DatadogECSFargateProps = {
  ...DatadogEcsBaseDefaultProps,
  logDriverConfiguration: DatadogECSFargateLogDriverDefaultProps,
  isLogRouterHealthCheckEnabled: false,
  logRouterHealthCheck: {
    command: ["curl -f http://127.0.0.1:2020/api/v1/health || exit 1"],
    interval: Duration.seconds(5),
    retries: 3,
    startPeriod: Duration.seconds(15),
    timeout: Duration.seconds(5),
  },
};
