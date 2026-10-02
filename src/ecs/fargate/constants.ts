/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import { Duration } from "aws-cdk-lib";
import { FirelensConfigFileType } from "aws-cdk-lib/aws-ecs";
import { DatadogECSFargateProps, DatadogECSLogDriverProps, LoggingType } from "./interfaces";
import { DatadogEcsBaseDefaultProps } from "../constants";

/**
 * Default environment variables for the Agent in Fargate Tasks
 */
export const FargateDefaultEnvVars = {
  ECS_FARGATE: "true",
};

/**
 * Default service name for the Datadog Agent
 */
export const DatadogAgentServiceName = "datadog-agent";

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

/**
 * Container names of the Datadog log router, CWS, and Agent config init containers
 */
export const LogRouterContainerName = "datadog-log-router";
export const CWSContainerName = "cws-instrumentation-init";
export const InitVolumeContainerName = "init-volume";

/**
 * Container and volume that copy the tracer for automatic APM instrumentation
 */
export const TracerContainerName = "datadog-tracer";
export const TracerVolumeName = "datadog-tracer";

/**
 * Path where the tracer volume is mounted in the tracer and application containers
 */
export const TracerMountPath = "/datadog-lib";

/**
 * Registry and default tag of the Datadog tracer images
 */
export const TracerImageRegistry = "public.ecr.aws/datadog";
export const DefaultTracerVersion = "latest";

/**
 * Valid tracer image tag
 */
export const TracerImageTagRegExp = /^[\w][\w.-]{0,127}$/;

/**
 * Entrypoint every tracer image exposes, which copies the tracer into the path it is given
 */
export const TracerCopyEntryPoint = "/datadog-init/copy-lib.sh";

/**
 * Root, so the tracer copy can write into the root-owned task volume
 */
export const TracerUser = "0";

/**
 * Task definition tag recording the automatic APM instrumentation mode
 */
export const InjectionModeTagKey = "dd_sls_injection_mode";
export const SingleLanguageInjectionMode = "single_language";

/**
 * DD_TAGS entry recording the automatic APM instrumentation mode on the instrumented container
 */
export const SingleLanguageInjectionModeTag = "_dd.injection.mode:serverless-single-lang";

/**
 * IDs of the automatic APM instrumentation warnings
 */
export const InjectionModeTagWarningId = "datadog-cdk-constructs-v2:apmInstrumentationTagRemoved";
export const TracerLogsWarningId = "datadog-cdk-constructs-v2:apmInstrumentationTracerLogsNotCollected";

/**
 * Containers the construct manages, which never load the tracer
 */
export const DatadogManagedContainerNames: ReadonlySet<string> = new Set([
  DatadogAgentServiceName,
  LogRouterContainerName,
  CWSContainerName,
  InitVolumeContainerName,
  TracerContainerName,
]);
