/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import { HealthCheck, FirelensOptions, FireLensLogDriver } from "aws-cdk-lib/aws-ecs";
import { CWSFeatureConfig, DatadogECSBaseProps, LogCollectionFeatureConfig } from "../interfaces";

export interface DatadogECSFargateProps extends DatadogECSBaseProps {
  readonly logCollection?: FargateLogCollectionFeatureConfig;
  readonly cws?: FargateCWSFeatureConfig;
  /**
   * Automatic APM instrumentation configuration.
   * Adds the Datadog tracer to an application container without changing its image.
   */
  readonly apmInstrumentation?: APMInstrumentationConfig;
}

/**
 * Automatic APM instrumentation configuration
 */
export interface APMInstrumentationConfig {
  /**
   * The application language, which selects the tracer to add.
   */
  readonly language: TracerLanguage;
  /**
   * The version of the tracer to add. Defaults to `latest`.
   */
  readonly tracerVersion?: string;
  /**
   * The C standard library that the application image uses. Defaults to `GLIBC`.
   */
  readonly tracerLibc?: TracerLibc;
  /**
   * The name of the application container that loads the tracer.
   * Required when the task definition has more than one application container.
   */
  readonly containerName?: string;
}

/**
 * Application language for automatic APM instrumentation.
 */
export enum TracerLanguage {
  JAVA = "java",
  NODEJS = "nodejs",
  DOTNET = "dotnet",
  PYTHON = "python",
  RUBY = "ruby",
  PHP = "php",
}

/**
 * C standard library of the application image.
 */
export enum TracerLibc {
  /**
   * Used by most Linux images, such as Debian and Ubuntu.
   */
  GLIBC = "glibc",
  /**
   * Used by Alpine Linux images.
   */
  MUSL = "musl",
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
   * Supply own FireLensLogDriver. Either this or logDriverConfig can be provided but not both.
   */
  readonly firelensLogDriver?: FireLensLogDriver;
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
  readonly isParseJson?: boolean;
}
