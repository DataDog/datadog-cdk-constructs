/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { HealthCheck } from "aws-cdk-lib/aws-ecs";
import * as secrets from "aws-cdk-lib/aws-secretsmanager";

export interface DatadogECSBaseProps {
  /**
   * The Datadog API key string.
   * Must define at least 1 source for the API key.
   */
  readonly apiKey?: string;
  /**
   * The Datadog API key secret.
   * Must define at least 1 source for the API key.
   */
  readonly apiKeySecret?: secrets.ISecret;
  /**
   * The ARN of the Datadog API key secret.
   * Must define at least 1 source for the API key.
   */
  readonly apiKeySecretArn?: string;

  /**
   * The registry to pull the Datadog Agent container image from.
   */
  readonly registry?: string;
  /**
   * The version of the Datadog Agent container image to use.
   */
  readonly imageVersion?: string;

  /**
   * The minimum number of CPU units to reserve
   * for the Datadog Agent container.
   */
  readonly cpu?: number;
  /**
   * The amount (in MiB) of memory to present
   * to the Datadog Agent container.
   */
  readonly memoryLimitMiB?: number;

  /**
   * Configure Datadog Agent container to be essential for the task.
   */
  readonly isDatadogEssential?: boolean;
  /**
   * Configure added containers to have container dependency on the Datadog Agent container.
   */
  readonly isDatadogDependencyEnabled?: boolean;
  /**
   * Configure health check for the Datadog Agent container.
   */
  readonly datadogHealthCheck?: HealthCheck;

  /**
   * The Datadog site to send data to.
   */
  readonly site?: string;
  /**
   * The cluster name to use for tagging.
   */
  readonly clusterName?: string;

  /**
   * Datadog Agent environment variables
   */
  readonly environmentVariables?: Record<string, string>;
  /**
   * Global tags to apply to all data sent by the Agent.
   * Overrides any DD_TAGS values in environmentVariables.
   */
  readonly globalTags?: string;

  /**
   * DogStatsD feature configuration
   */
  readonly dogstatsd?: DogstatsdFeatureConfig;
  /**
   * APM feature configuration
   */
  readonly apm?: APMFeatureConfig;
  /**
   * CWS feature configuration
   */
  readonly cws?: CWSFeatureConfig;

  /**
   * The task environment name. Used for tagging (UST).
   */
  readonly env?: string;
  /**
   * The task service name. Used for tagging (UST).
   */
  readonly service?: string;
  /**
   * The task version. Used for tagging (UST).
   */
  readonly version?: string;
}

/**
 * Log collection feature configuration
 */
export interface LogCollectionFeatureConfig {
  /**
   * Enables log collection
   */
  readonly isEnabled?: boolean;
}

/**
 * Dogstatsd feature configuration
 */
export interface DogstatsdFeatureConfig {
  /**
   * Enables Dogstatsd
   */
  readonly isEnabled?: boolean;
  /**
   * Enables Dogstatsd origin detection
   */
  readonly isOriginDetectionEnabled?: boolean;
  /**
   * Controls the cardinality of custom dogstatsd metrics
   */
  readonly dogstatsdCardinality?: Cardinality;
  /**
   * Enables Dogstatsd traffic over Unix Domain Socket.
   * Falls back to UDP configuration for application containers when disabled
   */
  readonly isSocketEnabled?: boolean;
}

/**
 * APM feature configuration
 */
export interface APMFeatureConfig {
  /**
   * Enables APM
   */
  readonly isEnabled?: boolean;
  /**
   * Enables APM traces traffic over Unix Domain Socket.
   * Falls back to TCP configuration for application containers when disabled
   */
  readonly isSocketEnabled?: boolean;
}

/**
 * CWS feature configuration
 */
export interface CWSFeatureConfig {
  /**
   * Enables CWS
   */
  readonly isEnabled?: boolean;

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

/**
 * Cardinality of metrics
 */
export enum Cardinality {
  LOW = "low",
  ORCHESTRATOR = "orchestrator",
  HIGH = "high",
}
