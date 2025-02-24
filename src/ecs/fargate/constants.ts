/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { Duration } from "aws-cdk-lib";
import { DatadogECSFargateProps, DatadogECSLogDriverProps } from "./interfaces";
import { DatadogEcsBaseDefaultProps } from "../constants";

/**
 * Default environment variables for the Agent in Fargate Tasks
 */
export const FargateDefaultEnvVars = {
  DD_ECS_TASK_COLLECTION_ENABLED: "true",
  ECS_FARGATE: "true",
};

/**
 * Default log driver configuration for ECS Fargate
 */
const DatadogECSLogDriverDefaultProps: DatadogECSLogDriverProps = {
  registry: "public.ecr.aws/aws-observability/aws-for-fluent-bit",
  imageVersion: "stable",
  hostEndpoint: "http-intake.logs.datadoghq.com",
};

/**
 * Default props for the Datadog ECS Fargate construct
 */
export const DatadogEcsFargateDefaultProps: DatadogECSFargateProps = {
  ...DatadogEcsBaseDefaultProps,
  logCollection: {
    isEnabled: false,
    logDriverConfiguration: DatadogECSLogDriverDefaultProps,
    isLogRouterEssential: false,
    isLogRouterHealthCheckEnabled: false,
    logRouterHealthCheck: {
      command: ["curl -f http://127.0.0.1:2020/api/v1/health || exit 1"],
      interval: Duration.seconds(5),
      retries: 3,
      startPeriod: Duration.seconds(15),
      timeout: Duration.seconds(5),
    },
  },
};
