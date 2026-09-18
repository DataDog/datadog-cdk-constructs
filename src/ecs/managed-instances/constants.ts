/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import { Duration } from "aws-cdk-lib";
import { DatadogEcsBaseDefaultProps } from "../constants";
import { DatadogECSManagedInstancesProps } from "./interfaces";

/**
 * Default environment variables for the Agent in a daemon task on ECS Managed Instances.
 */
export const ManagedInstancesDefaultEnvVars = {
  ECS_MANAGED_INSTANCES: "true",
};

/**
 * Default service name for the Datadog Agent
 */
export const DatadogAgentServiceName = "datadog-agent";

/**
 * Minimum Datadog Agent version required for ECS Managed Instances daemon mode.
 */
export const MinimumAgentVersion = "7.77.0";

/**
 * The static daemon bridge IP used to reach the Datadog Agent daemon over TCP
 * (IPv4). Daemons on an ECS Managed Instance share a single network namespace.
 */
export const DaemonBridgeIpv4 = "169.254.172.2";

/**
 * Default props for the Datadog ECS Managed Instances construct.
 */
export const DatadogEcsManagedInstancesDefaultProps: Partial<DatadogECSManagedInstancesProps> = {
  ...DatadogEcsBaseDefaultProps,

  // Unlike the Fargate sidecar (essential: false, since other app containers
  // share the task), the daemon task contains only the Datadog Agent
  // container, so it defaults to essential.
  isDatadogEssential: true,

  // AWS::ECS::DaemonTaskDefinition requires every container to explicitly set
  // memory or memoryReservation, unlike aws_ecs_task_definition/Fargate where
  // container-level memory can be omitted when task-level memory is set -
  // confirmed live ("Invalid setting for container 'datadog-agent'. At least
  // one of 'memory' or 'memoryReservation' must be specified."). These
  // defaults match the parity Terraform module's dd_cpu/dd_memory_limit_mib.
  cpu: 256,
  memoryLimitMiB: 512,

  criSocketPath: "/var/run/containerd/containerd.sock",
  procPath: "/proc/",
  cgroupPath: "/sys/fs/cgroup/",

  createDaemon: true,
  propagateTags: "DAEMON",
  enableEcsManagedTags: true,
  enableExecuteCommand: false,

  logCollection: {
    isEnabled: false,
  },
  networkMonitoring: {
    isEnabled: false,
  },
  processCollection: {
    isEnabled: false,
  },
  deploymentConfiguration: {
    drainPercent: 25,
    bakeTimeInMinutes: 0,
    alarms: {
      alarmNames: [],
      enable: false,
    },
  },

  // Datadog's own documented health check command for ECS Managed Instances
  // daemon mode. `AWS::ECS::Daemon` defaults `critical` behavior (no way to
  // opt out via CloudFormation): if this health check fails, AWS drains and
  // replaces the underlying EC2 instance, so this default minimizes the
  // chance of a false-positive triggering that.
  datadogHealthCheck: {
    command: ["CMD-SHELL", "agent health"],
    interval: Duration.seconds(30),
    retries: 3,
    startPeriod: Duration.seconds(15),
    timeout: Duration.seconds(5),
  },
};
