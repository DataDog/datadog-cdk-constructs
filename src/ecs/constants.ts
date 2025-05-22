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

  apm: {
    isEnabled: true,
    isSocketEnabled: true,
    traceInferredProxyServices: false,
  },

  dogstatsd: {
    isEnabled: true,
    isSocketEnabled: true,
    isOriginDetectionEnabled: true,
    dogstatsdCardinality: Cardinality.ORCHESTRATOR,
  },

  isDatadogEssential: false,
  isDatadogDependencyEnabled: false,
  datadogHealthCheck: {
    command: ["/probe.sh"],
    interval: Duration.seconds(10),
    retries: 3,
    startPeriod: Duration.seconds(60),
    timeout: Duration.seconds(5),
  },
};

/**
 * Valid Datadog site URLs
 */
export const siteList: string[] = [
  "datadoghq.com",
  "datadoghq.eu",
  "us3.datadoghq.com",
  "us5.datadoghq.com",
  "ap1.datadoghq.com",
  "ddog-gov.com",
];
