/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { Duration } from "aws-cdk-lib";
import { FirelensConfigFileType } from "aws-cdk-lib/aws-ecs";
import { DatadogECSFargateProps, DatadogECSLogDriverProps, LoggingType } from "./interfaces";
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
  hostEndpoint: "http-intake.logs.datadoghq.com",
};

/**
 * Default props for the Datadog ECS Fargate construct
 */
export const DatadogEcsFargateDefaultProps: DatadogECSFargateProps = {
  ...DatadogEcsBaseDefaultProps,
  logCollection: {
    isEnabled: false,
    loggingType: LoggingType.FLUENTBIT,
    fluentbitConfig: {
      logDriverConfig: DatadogECSLogDriverDefaultProps,
      isLogRouterEssential: false,
      isLogRouterDependencyEnabled: false,
      logRouterHealthCheck: {
        // Note: below is the recommended command for the health check,
        // however, this requires changes to the fluent-bit.conf file to
        // expose the health check endpoint. To ease configuration, the
        // default command will only check that the container successfully
        // started via "exit 0".
        // command: ["curl -f http://127.0.0.1:2020/api/v1/health || exit 1"],
        command: ["exit 0"],
        interval: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(15),
        timeout: Duration.seconds(5),
      },
      registry: "public.ecr.aws/aws-observability/aws-for-fluent-bit",
      imageVersion: "stable",
      firelensOptions: {
        isParseJson: false,
      },
    },
  },
  cws: {
    isEnabled: false,
  },
};

/**
 * Default CWS entrypoint prefix for application containers
 */
export const EntryPointPrefixCWS = ["/cws-instrumentation-volume/cws-instrumentation", "trace", "--"];

/**
 * Config file type for the Firelens configuration parsing JSON
 */
export const ParseJsonFirelensConfigFileType = FirelensConfigFileType.FILE;

/**
 * Config file path for the Firelens configuration parsing JSON
 */
export const ParseJsonFirelensConfigFileValue = "/fluent-bit/configs/parse-json.conf";
