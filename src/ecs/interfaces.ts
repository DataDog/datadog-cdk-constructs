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
  // Must define at least 1 source for the API key
  readonly apiKey?: string;
  readonly apiKeySecret?: secrets.ISecret;
  readonly apiKeySecretArn?: string;

  // Agent container configuration
  readonly registry?: string;
  readonly imageVersion?: string;

  readonly isDatadogEssential?: boolean;
  readonly isDatadogDependencyEnabled?: boolean;
  readonly datadogHealthCheck?: HealthCheck;

  readonly clusterName?: string;
  readonly site?: string;

  // Features to enable
  // readonly logCollection?: LogCollectionFeatureConfig;
  readonly dogstatsd?: DogstatsdFeatureConfig;
  readonly apm?: APMFeatureConfig;
  readonly cws?: CWSFeatureConfig;

  /**
   * Datadog Agent environment variables
   */
  readonly environmentVariables?: Record<string, string>;

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

  /**
   * Global tags to apply to all data sent by the Agent.
   * Overrides any DD_TAGS values in environmentVariables.
   */
  readonly globalTags?: string;
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
}

/**
 * Cardinality of metrics
 */
export enum Cardinality {
  LOW = "low",
  ORCHESTRATOR = "orchestrator",
  HIGH = "high",
}
