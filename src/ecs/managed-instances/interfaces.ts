/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import * as iam from "aws-cdk-lib/aws-iam";
import { LogCollectionFeatureConfig, DatadogECSBaseProps } from "../interfaces";

export interface DatadogECSManagedInstancesProps extends DatadogECSBaseProps {
  /**
   * A unique name for the daemon task definition family.
   */
  readonly family: string;
  /**
   * Number of cpu units used by the daemon task, as a string (e.g. "256").
   */
  readonly taskCpu?: string;
  /**
   * Amount (in MiB) of memory used by the daemon task, as a string (e.g. "512").
   */
  readonly taskMemory?: string;
  /**
   * The IAM role that allows the Datadog Agent container to make calls to other AWS services.
   * Created automatically if not provided.
   */
  readonly taskRole?: iam.IRole;
  /**
   * The IAM role that grants the Amazon ECS container agent permission to make AWS API calls.
   * Created automatically if not provided.
   */
  readonly executionRole?: iam.IRole;
  /**
   * Additional host-path volumes to add to the daemon task, beyond the ones this
   * construct manages (containerd socket, /proc, /sys/fs/cgroup, UDS sockets,
   * network monitoring debug mount).
   */
  readonly volumes?: ManagedInstancesVolume[];

  /**
   * Log collection is not supported for the Datadog Agent running as an
   * ECS Managed Daemon on ECS Managed Instances. Defining this property with
   * `isEnabled: true` will cause construct validation to fail.
   */
  readonly logCollection?: LogCollectionFeatureConfig;
  /**
   * Configuration for Datadog Cloud Network Monitoring. Linux only.
   */
  readonly networkMonitoring?: NetworkMonitoringFeatureConfig;
  /**
   * Configuration for Datadog Live Process collection.
   */
  readonly processCollection?: ProcessCollectionFeatureConfig;
  /**
   * Log configuration for the Datadog Agent container's OWN logs (not application
   * container logs, which the agent cannot collect in daemon mode on ECS Managed
   * Instances), e.g. routing to CloudWatch via the awslogs driver.
   */
  readonly agentLogConfiguration?: ManagedInstancesLogConfiguration;

  /**
   * Path to the containerd socket on the host. ECS Managed Instances uses
   * containerd, not Docker.
   * @default "/var/run/containerd/containerd.sock"
   */
  readonly criSocketPath?: string;
  /**
   * Path to the /proc directory on the host.
   * @default "/proc/"
   */
  readonly procPath?: string;
  /**
   * Path to the cgroup directory on the host.
   * @default "/sys/fs/cgroup/"
   */
  readonly cgroupPath?: string;

  /**
   * The PID namespace mode for the daemon task. AWS only accepts `shared` or
   * `none` for a daemon task definition (`host` is rejected). DogStatsD/APM
   * origin detection does not require this to be set: Datadog client
   * libraries embed the container ID directly in the packet, which works the
   * same way over UDS and TCP regardless of PID namespace configuration.
   */
  readonly pidMode?: string;
  /**
   * The IPC namespace mode for the daemon task. AWS only accepts `shared` or
   * `none` for a daemon task definition (`host` is rejected).
   */
  readonly ipcMode?: string;

  /**
   * Whether to create the `AWS::ECS::Daemon` resource. If false, only the
   * daemon task definition is created.
   * @default true
   */
  readonly createDaemon?: boolean;
  /**
   * ARN of the ECS cluster where the Datadog Agent daemon will run.
   * Required if `createDaemon` is true.
   */
  readonly clusterArn?: string;
  /**
   * ARNs of ECS Managed Instances capacity providers the daemon should run on.
   * Required if `createDaemon` is true. This construct does not create the
   * capacity provider, infrastructure role, or instance profile - those must
   * already exist.
   */
  readonly capacityProviderArns?: string[];
  /**
   * Name of the ECS daemon.
   * @default `${family}-datadog-agent`
   */
  readonly daemonName?: string;
  /**
   * Propagate tags to daemon tasks.
   * @default "DAEMON"
   */
  readonly propagateTags?: string;
  /**
   * Enable ECS managed tags for the daemon.
   * @default true
   */
  readonly enableEcsManagedTags?: boolean;
  /**
   * Enable ECS Exec for daemon tasks.
   * @default false
   */
  readonly enableExecuteCommand?: boolean;
  /**
   * Controls the daemon's rolling deployment behavior across instances. Any
   * change to the daemon task definition - including something as small as a
   * tag - forces a full replacement, and AWS's daemon deployment model drains
   * and replaces every EC2 instance in the attached capacity provider(s). This
   * block is write-only on the AWS side (not readable back from the API), so
   * `cdk diff` will always show a diff here - that is expected.
   */
  readonly deploymentConfiguration?: DeploymentConfiguration;
  /**
   * A map of additional tags to add to the daemon task definition/daemon created.
   */
  readonly tags?: Record<string, string>;
}

/**
 * A host-path volume definition for the daemon task. The volume block on
 * `AWS::ECS::DaemonTaskDefinition` only supports a name and an optional host
 * source path - no Docker volume/EFS/FSx volume types.
 */
export interface ManagedInstancesVolume {
  readonly name: string;
  readonly hostPath?: string;
}

/**
 * Cloud Network Monitoring configuration
 */
export interface NetworkMonitoringFeatureConfig {
  /**
   * Enables Cloud Network Monitoring. Linux only.
   */
  readonly isEnabled?: boolean;
}

/**
 * Live Process Collection configuration
 */
export interface ProcessCollectionFeatureConfig {
  /**
   * Enables Live Process Collection.
   */
  readonly isEnabled?: boolean;
}

/**
 * Log configuration for the Datadog Agent container's own logs.
 */
export interface ManagedInstancesLogConfiguration {
  readonly logDriver?: string;
  readonly options?: Record<string, string>;
  readonly secretOptions?: ManagedInstancesLogSecretOption[];
}

export interface ManagedInstancesLogSecretOption {
  readonly name: string;
  readonly valueFrom: string;
}

/**
 * Controls the daemon's rolling deployment behavior across instances.
 */
export interface DeploymentConfiguration {
  /**
   * The percentage of instances to drain simultaneously during a daemon deployment.
   * @default 25
   */
  readonly drainPercent?: number;
  /**
   * The amount of time (in minutes) to wait after a successful deployment step
   * before proceeding.
   * @default 0
   */
  readonly bakeTimeInMinutes?: number;
  /**
   * CloudWatch alarm configuration for the daemon deployment.
   */
  readonly alarms?: DeploymentAlarmConfiguration;
}

export interface DeploymentAlarmConfiguration {
  /**
   * The CloudWatch alarm names to monitor during a daemon deployment.
   * @default []
   */
  readonly alarmNames?: string[];
  /**
   * Determines whether to use the CloudWatch alarm option in the daemon
   * deployment process.
   * @default false
   */
  readonly enable?: boolean;
}
