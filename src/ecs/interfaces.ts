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
  readonly memoryLimitMiB?: number;

  readonly clusterName?: string;
  readonly site?: string;
  readonly logLevel?: string;

  readonly isDatadogEssential?: boolean;
  readonly isHealthCheckEnabled?: boolean;
  readonly datadogHealthCheck?: HealthCheck;

  /**
   * Datadog Agent environment variables
   */
  readonly environmentVariables?: Record<string, string>;

  // Features to enable
  readonly enableLogCollection?: boolean;
  readonly enableASM?: boolean;

  /**
   * Enables Dogstatsd custom metrics collection
   * * * * * * * * * * * * * * * * * * * * * * *
   */
  readonly enableDogstatsd?: boolean;
  /**
   * Enables Dogstatsd origin detection
   */
  readonly enableDogstatsdOriginDetection?: boolean;
  /**
   * Controls the cardinality of custom dogstatsd metrics
   */
  readonly dogstatsdCardinality?: Cardinality;
  /**
   * Enables Dogstatsd traffic over Unix Domain Socket.
   * Falls back to UDP configuration for application containers when disabled
   */
  readonly enableDogstatsdSocket?: boolean;

  /**
   * Enables APM traces collection
   * * * * * * * * * * * * * * * *
   */
  readonly enableAPM?: boolean;
  /**
   * Enables APM traces traffic over Unix Domain Socket.
   * Falls back to TCP configuration for application containers when disabled
   */
  readonly enableAPMSocket?: boolean;

  /**
   * Enables CWS (Cloud Workload Security)
   * * * * * * * * * * * * * * * * * * * *
   */
  readonly enableCWS?: boolean;

  /**
   * Enable USM (Universal Service Monitoring)
   * * * * * * * * * * * * * * * * * * * * * *
   */
  readonly enableUSM?: boolean;
  /**
   * The task environment name. Used for tagging (UST/USM)
   */
  readonly env?: string;
  /**
   * The task service name. Used for tagging (UST/USM)
   */
  readonly service?: string;
  /**
   * The task version. Used for tagging (UST/USM)
   */
  readonly version?: string;

  /**
   * Global tags to apply to all data sent by the Agent.
   * Overrides any DD_TAGS values in environmentVariables
   */
  readonly globalTags?: string;
}

/**
 * Cardinality of metrics
 */
export enum Cardinality {
  LOW = "low",
  ORCHESTRATOR = "orchestrator",
  HIGH = "high",
}
