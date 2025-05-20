/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { HealthCheck, Secret, FirelensOptions } from "aws-cdk-lib/aws-ecs";
import { EnvVarManager } from "../environment";
import { CWSFeatureConfig, DatadogECSBaseProps, LogCollectionFeatureConfig } from "../interfaces";

export interface DatadogECSFargateProps extends DatadogECSBaseProps {
  readonly logCollection?: FargateLogCollectionFeatureConfig;
  readonly cws?: FargateCWSFeatureConfig;
}

export interface FargateCWSFeatureConfig extends CWSFeatureConfig {
  /**
   * The minimum number of CPU units to reserve
   * for the Datadog CWS init container.
   */
  readonly cpu?: number;
  /**
   * The amount (in MiB) of memory to present
   * to the Datadog CWS init container.
   */
  readonly memoryLimitMiB?: number;
}

export interface FargateLogCollectionFeatureConfig extends LogCollectionFeatureConfig {
  /**
   * Type of log collection.
   */
  readonly loggingType?: LoggingType;
  /**
   * Fluentbit log collection configuration.
   */
  readonly fluentbitConfig?: FluentbitConfig;
}

export interface FluentbitConfig {
  /**
   * Configuration for the Datadog log driver.
   */
  readonly logDriverConfig?: DatadogECSLogDriverProps;
  /**
   * Firelens options for the Fluentbit container.
   */
  readonly firelensOptions?: DatadogFirelensOptions;
  /**
   * Makes the log router essential.
   */
  readonly isLogRouterEssential?: boolean;
  /**
   * Enables the log router health check.
   */
  readonly isLogRouterDependencyEnabled?: boolean;
  /**
   * Health check configuration for the log router.
   */
  readonly logRouterHealthCheck?: HealthCheck;
  /**
   * The registry to pull the Fluentbit container image from.
   */
  readonly registry?: string;
  /**
   * The version of the Fluentbit container image to use.
   */
  readonly imageVersion?: string;
  /**
   * The minimum number of CPU units to reserve
   * for the Datadog fluent-bit container.
   */
  readonly cpu?: number;
  /**
   * The amount (in MiB) of memory to present
   * to the Datadog fluent-bit container.
   */
  readonly memoryLimitMiB?: number;
}

/**
 * Internal props for the Datadog ECS Fargate construct.
 */
export interface DatadogECSFargateInternalProps extends DatadogECSFargateProps {
  readonly envVarManager: EnvVarManager;
  readonly isLinux: boolean;
  readonly isSocketRequired: boolean;
  readonly isProtocolRequired: boolean;
  readonly datadogSecret?: Secret;
}

/**
 * Type of datadog logging configuration.
 */
export enum LoggingType {
  /**
   * Forwarding logs to Datadog using Fluentbit container.
   * Only compatible on Linux.
   */
  FLUENTBIT = "fluentbit",
  /**
   * Currently unsupported within this construct,
   * must configure manually on containers.
   * https://docs.datadoghq.com/integrations/ecs_fargate/?tab=webui#aws-log-driver
   */
  // LAMBDAFORWARDER = "lambda",
}

/**
 * Datadog Fluentbit log driver configuration.
 * https://docs.fluentbit.io/manual/pipeline/outputs/datadog
 */
export interface DatadogECSLogDriverProps {
  readonly hostEndpoint?: string;
  readonly tls?: string;
  readonly compress?: string;
  readonly serviceName?: string;
  readonly sourceName?: string;
  readonly messageKey?: string;
}

export interface DatadogFirelensOptions extends FirelensOptions {
  /**
   * Overrides the config file type and value to support JSON parsing.
   */
  isParseJson?: boolean;
}
