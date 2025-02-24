/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { Duration } from "aws-cdk-lib";
import { DatadogECSBaseProps, Cardinality } from "./interfaces";

/**
 * Default props for the Datadog ECS Fargate construct
 */
export const DatadogEcsBaseDefaultProps: DatadogECSBaseProps = {
  registry: "public.ecr.aws/datadog/agent",
  imageVersion: "latest",
  memoryLimitMiB: 1024,

  site: "datadoghq.com",
  logLevel: "INFO",

  enableAPM: true,
  enableAPMSocket: true,

  enableDogstatsd: true,
  enableDogstatsdSocket: true,
  enableDogstatsdOriginDetection: false,
  dogstatsdCardinality: Cardinality.LOW,

  enableLogCollection: false,
  enableASM: false,
  enableCWS: false,

  isHealthCheckEnabled: true,
  datadogHealthCheck: {
    command: ["agent", "health"],
    interval: Duration.seconds(5),
    retries: 3,
    startPeriod: Duration.seconds(15),
    timeout: Duration.seconds(5),
  },
};

/**
 * Default CWS entrypoint prefix for application containers
 */
export const entryPointPrefixCWS = ["/cws-instrumentation-volume/cws-instrumentation", "trace", "--"];
