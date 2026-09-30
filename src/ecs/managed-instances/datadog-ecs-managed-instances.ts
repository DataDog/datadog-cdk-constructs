/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import { Tags } from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { DatadogAgentServiceName, DatadogEcsManagedInstancesDefaultProps } from "./constants";
import { ManagedInstancesEnvVarManager } from "./environment";
import { DatadogECSManagedInstancesProps } from "./interfaces";
import { DatadogECSManagedInstancesInternalProps } from "./internal.interfaces";
import { mergeManagedInstancesProps, validateECSManagedInstancesProps } from "./utils";
import * as versionJson from "../../../version.json";
import { TagKeys } from "../../constants";
import { getSecretApiKey, validateECSBaseProps } from "../utils";

type VolumeProperty = ecs.CfnDaemonTaskDefinition.VolumeProperty;
type MountPointProperty = ecs.CfnDaemonTaskDefinition.MountPointProperty;

/** A host-path volume paired with the mount point the agent container uses for it. */
interface VolumeMount {
  readonly volume: VolumeProperty;
  readonly mountPoint: MountPointProperty;
}

/**
 * The Datadog ECS Managed Instances construct manages the Datadog
 * configuration for Datadog Agent daemons running on ECS Managed Instances.
 */
export class DatadogECSManagedInstances {
  private readonly datadogProps: DatadogECSManagedInstancesProps;

  constructor(datadogProps: DatadogECSManagedInstancesProps) {
    this.datadogProps = datadogProps;
  }

  /**
   * Creates a new Datadog Agent daemon task definition (and, unless
   * `createDaemon` is false, the daemon itself).
   * Merges the provided datadogProps with the class's datadogProps.
   * @param scope
   * @param id
   * @param datadogProps optional: Datadog ECS Managed Instances properties override values
   */
  public daemonTaskDefinition(
    scope: Construct,
    id: string,
    datadogProps?: DatadogECSManagedInstancesProps,
  ): DatadogECSManagedInstancesDaemonTaskDefinition {
    const mergedProps = mergeManagedInstancesProps(this.datadogProps, datadogProps);
    return new DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, mergedProps);
  }
}

/**
 * Deploys the Datadog Agent as an ECS Managed Daemon on ECS Managed Instances.
 *
 * Unlike `DatadogECSFargateTaskDefinition`, this construct does not extend an
 * AWS CDK L2 task definition class - `AWS::ECS::DaemonTaskDefinition` has no
 * L2 equivalent, and its container definition is a single value set at
 * construction rather than built incrementally via `addContainer`. This is
 * inherent to the daemon deployment model, not a limitation relative to the
 * Fargate module: the daemon task definition holds only the Datadog Agent
 * container. Application containers run in their own, separate task
 * definitions and are wired to the daemon over the shared UDS socket volume
 * (see `appDdSocketsVolume` / `appDdSocketsMountPoint`) or TCP (see
 * `dogstatsdEnvironment` / `apmEnvironment`).
 */
export class DatadogECSManagedInstancesDaemonTaskDefinition extends Construct {
  private readonly datadogProps: DatadogECSManagedInstancesInternalProps;

  /**
   * The underlying `AWS::ECS::DaemonTaskDefinition` resource.
   */
  public readonly taskDefinition: ecs.CfnDaemonTaskDefinition;
  /**
   * The underlying `AWS::ECS::Daemon` resource. Only defined if `createDaemon` is true.
   */
  public readonly daemon?: ecs.CfnDaemon;
  /**
   * The IAM role used by the Datadog Agent container to make AWS API calls.
   */
  public readonly taskRole: iam.IRole;
  /**
   * The IAM role used by ECS to pull the Datadog Agent image and access secrets.
   */
  public readonly executionRole: iam.IRole;

  /**
   * Volume definition for the shared UDS socket directory. Add this to an
   * application task definition's volumes to enable UDS communication with
   * the Datadog Agent daemon. Only defined when UDS is required.
   */
  public readonly appDdSocketsVolume?: VolumeProperty;
  /**
   * Mount point for the shared UDS socket directory. Add this to an
   * application container's mountPoints. Only defined when UDS is required.
   */
  public readonly appDdSocketsMountPoint?: MountPointProperty;
  /**
   * Environment variables for DogStatsD in application containers. Empty
   * unless DogStatsD is enabled and UDS is in use.
   */
  public readonly dogstatsdEnvironment: ecs.CfnDaemonTaskDefinition.KeyValuePairProperty[];
  /**
   * Environment variables for APM in application containers. Empty unless
   * APM is enabled and UDS is in use.
   */
  public readonly apmEnvironment: ecs.CfnDaemonTaskDefinition.KeyValuePairProperty[];
  /**
   * Environment variables for Data Streams Monitoring in application
   * containers. Empty unless APM and `apm.dataStreams` are both enabled.
   * Data Streams Monitoring is an application/tracer-side feature - this is
   * for the application container that produces or consumes messages, not
   * the Datadog Agent container.
   */
  public readonly dataStreamsEnvironment: ecs.CfnDaemonTaskDefinition.KeyValuePairProperty[];

  constructor(scope: Construct, id: string, datadogProps?: DatadogECSManagedInstancesProps) {
    super(scope, id);

    this.datadogProps = this.getCompleteProps(datadogProps);
    validateECSBaseProps(this.datadogProps);
    validateECSManagedInstancesProps(this.datadogProps);

    this.executionRole = this.resolveExecutionRole();
    this.taskRole = this.resolveTaskRole();

    const volumeMounts = this.buildVolumeMounts();
    const userVolumes: VolumeProperty[] = (this.datadogProps.volumes ?? []).map((volume) => ({
      name: volume.name,
      host: volume.hostPath !== undefined ? { sourcePath: volume.hostPath } : undefined,
    }));

    this.taskDefinition = new ecs.CfnDaemonTaskDefinition(this, "TaskDefinition", {
      family: this.datadogProps.family,
      cpu: this.datadogProps.taskCpu,
      memory: this.datadogProps.taskMemory,
      pidMode: this.datadogProps.pidMode,
      ipcMode: this.datadogProps.ipcMode,
      taskRoleArn: this.taskRole.roleArn,
      executionRoleArn: this.executionRole.roleArn,
      containerDefinitions: [
        this.buildAgentContainerDefinition(volumeMounts.map((volumeMount) => volumeMount.mountPoint)),
      ],
      // Additional user-provided volumes are declared on the task but not
      // auto-mounted into the agent container - this task has exactly one
      // container, so mounting is left to the caller's own container
      // definition needs, matching the parity Terraform module's behavior.
      volumes: [...volumeMounts.map((volumeMount) => volumeMount.volume), ...userVolumes],
      tags: this.renderTags(),
    });

    if (this.datadogProps.createDaemon) {
      this.daemon = new ecs.CfnDaemon(this, "Daemon", {
        daemonName: this.datadogProps.daemonName ?? `${this.datadogProps.family}-datadog-agent`,
        clusterArn: this.datadogProps.clusterArn,
        daemonTaskDefinitionArn: this.taskDefinition.attrDaemonTaskDefinitionArn,
        capacityProviderArns: this.datadogProps.capacityProviderArns,
        deploymentConfiguration: {
          drainPercent: this.datadogProps.deploymentConfiguration!.drainPercent,
          bakeTimeInMinutes: this.datadogProps.deploymentConfiguration!.bakeTimeInMinutes,
          alarms: {
            alarmNames: this.datadogProps.deploymentConfiguration!.alarms!.alarmNames,
            enable: this.datadogProps.deploymentConfiguration!.alarms!.enable,
          },
        },
        enableEcsManagedTags: this.datadogProps.enableEcsManagedTags,
        enableExecuteCommand: this.datadogProps.enableExecuteCommand,
        propagateTags: this.datadogProps.propagateTags,
        tags: this.renderTags(),
      });
      this.daemon.addDependency(this.taskDefinition);
    }

    if (this.datadogProps.isSocketRequired) {
      this.appDdSocketsVolume = { name: "dd-sockets", host: { sourcePath: "/var/run/datadog" } };
      this.appDdSocketsMountPoint = {
        sourceVolume: "dd-sockets",
        containerPath: "/var/run/datadog",
        readOnly: true,
      };
    }

    this.dogstatsdEnvironment =
      this.datadogProps.dogstatsd!.isEnabled && this.datadogProps.dogstatsd!.isSocketEnabled
        ? [{ name: "DD_DOGSTATSD_URL", value: "unix:///var/run/datadog/dsd.socket" }]
        : [];
    this.apmEnvironment =
      this.datadogProps.apm!.isEnabled && this.datadogProps.apm!.isSocketEnabled
        ? [{ name: "DD_TRACE_AGENT_URL", value: "unix:///var/run/datadog/apm.socket" }]
        : [];
    // Data Streams Monitoring is transport-independent (it configures the
    // tracer itself, not how the tracer reaches the agent), so this is not
    // gated on isSocketEnabled the way dogstatsdEnvironment/apmEnvironment are.
    this.dataStreamsEnvironment =
      this.datadogProps.apm!.isEnabled && this.datadogProps.apm!.dataStreams
        ? [{ name: "DD_DATA_STREAMS_ENABLED", value: "true" }]
        : [];

    this.addCdkConstructVersionTag();
  }

  /**
   * Volumes the module manages (containerd/proc/cgroup, the shared UDS socket
   * directory, and the network-monitoring debug mount), each paired with the
   * mount point the agent container itself uses to read/write it.
   */
  private buildVolumeMounts(): VolumeMount[] {
    const props = this.datadogProps;

    const criVolumeMounts: VolumeMount[] = [
      {
        volume: { name: "containerd_sock", host: { sourcePath: props.criSocketPath } },
        mountPoint: {
          sourceVolume: "containerd_sock",
          containerPath: "/var/run/containerd/containerd.sock",
          readOnly: true,
        },
      },
      {
        volume: { name: "proc", host: { sourcePath: props.procPath } },
        mountPoint: { sourceVolume: "proc", containerPath: "/host/proc", readOnly: true },
      },
      {
        volume: { name: "cgroup", host: { sourcePath: props.cgroupPath } },
        mountPoint: { sourceVolume: "cgroup", containerPath: "/host/sys/fs/cgroup", readOnly: true },
      },
    ];

    const socketVolumeMount: VolumeMount = {
      volume: { name: "dd-sockets", host: { sourcePath: "/var/run/datadog" } },
      mountPoint: { sourceVolume: "dd-sockets", containerPath: "/var/run/datadog", readOnly: false },
    };
    const socketVolumeMounts: VolumeMount[] = props.isSocketRequired ? [socketVolumeMount] : [];

    const networkMonitoringVolumeMount: VolumeMount = {
      volume: { name: "debug", host: { sourcePath: "/sys/kernel/debug" } },
      mountPoint: { sourceVolume: "debug", containerPath: "/sys/kernel/debug", readOnly: false },
    };
    const networkMonitoringVolumeMounts: VolumeMount[] = props.networkMonitoring?.isEnabled
      ? [networkMonitoringVolumeMount]
      : [];

    return [...criVolumeMounts, ...socketVolumeMounts, ...networkMonitoringVolumeMounts];
  }

  private buildAgentContainerDefinition(
    agentMountPoints: MountPointProperty[],
  ): ecs.CfnDaemonTaskDefinition.DaemonContainerDefinitionProperty {
    const props = this.datadogProps;
    const healthCheck = props.datadogHealthCheck;
    const environment = Object.entries(props.envVarManager.retrieveAll()).map(([name, value]) => ({ name, value }));

    let renderedHealthCheck: ecs.CfnDaemonTaskDefinition.HealthCheckProperty | undefined;
    if (healthCheck) {
      renderedHealthCheck = {
        command: healthCheck.command,
        interval: healthCheck.interval?.toSeconds(),
        retries: healthCheck.retries,
        startPeriod: healthCheck.startPeriod?.toSeconds(),
        timeout: healthCheck.timeout?.toSeconds(),
      };
    }

    // Datadog's documented capability set for Cloud Network Monitoring in daemon mode.
    const networkMonitoringCapabilities = [
      "SYS_ADMIN",
      "SYS_RESOURCE",
      "SYS_PTRACE",
      "NET_ADMIN",
      "NET_BROADCAST",
      "NET_RAW",
      "IPC_LOCK",
      "CHOWN",
    ];
    let renderedLinuxParameters: ecs.CfnDaemonTaskDefinition.LinuxParametersProperty | undefined;
    if (props.networkMonitoring?.isEnabled) {
      renderedLinuxParameters = { capabilities: { add: networkMonitoringCapabilities } };
    }

    let renderedLogConfiguration: ecs.CfnDaemonTaskDefinition.LogConfigurationProperty | undefined;
    if (props.agentLogConfiguration) {
      renderedLogConfiguration = {
        logDriver: props.agentLogConfiguration.logDriver ?? "awslogs",
        options: props.agentLogConfiguration.options,
        secretOptions: props.agentLogConfiguration.secretOptions?.map((secretOption) => ({
          name: secretOption.name,
          valueFrom: secretOption.valueFrom,
        })),
      };
    }

    return {
      name: DatadogAgentServiceName,
      image: `${props.registry}:${props.imageVersion}`,
      essential: props.isDatadogEssential,
      cpu: props.cpu,
      memory: props.memoryLimitMiB,
      environment,
      mountPoints: agentMountPoints,
      secrets: props.datadogSecret ? [{ name: "DD_API_KEY", valueFrom: props.datadogSecret.arn }] : undefined,
      healthCheck: renderedHealthCheck,
      linuxParameters: renderedLinuxParameters,
      logConfiguration: renderedLogConfiguration,
    };
  }

  private resolveExecutionRole(): iam.IRole {
    const props = this.datadogProps;
    const role =
      props.executionRole ??
      new iam.Role(this, "ExecutionRole", {
        assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy")],
      });
    if (props.datadogSecret) {
      props.datadogSecret.grantRead(role);
    }
    return role;
  }

  private resolveTaskRole(): iam.IRole {
    const props = this.datadogProps;
    const role =
      props.taskRole ??
      new iam.Role(this, "TaskRole", {
        assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      });

    role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          "ecs:ListClusters",
          "ecs:ListContainerInstances",
          "ecs:DescribeContainerInstances",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
        ],
        resources: ["*"],
      }),
    );
    role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: ["ec2:DescribeInstances", "ec2:DescribeTags"],
        resources: ["*"],
      }),
    );

    return role;
  }

  private renderTags(): Array<{ key: string; value: string }> | undefined {
    const tags = this.datadogProps.tags;
    if (tags === undefined || Object.keys(tags).length === 0) {
      return undefined;
    }
    return Object.entries(tags).map(([key, value]) => ({ key, value }));
  }

  private addCdkConstructVersionTag(): void {
    Tags.of(this.taskDefinition).add(TagKeys.CDK, `v${versionJson.version}`, {
      includeResourceTypes: ["AWS::ECS::DaemonTaskDefinition"],
    });
    if (this.daemon) {
      Tags.of(this.daemon).add(TagKeys.CDK, `v${versionJson.version}`, {
        includeResourceTypes: ["AWS::ECS::Daemon"],
      });
    }
  }

  private getCompleteProps(
    datadogProps: DatadogECSManagedInstancesProps | undefined,
  ): DatadogECSManagedInstancesInternalProps {
    const mergedProps = mergeManagedInstancesProps(
      DatadogEcsManagedInstancesDefaultProps as DatadogECSManagedInstancesProps,
      datadogProps,
    );
    const isProtocolRequired =
      (mergedProps.dogstatsd!.isEnabled! && !mergedProps.dogstatsd!.isSocketEnabled!) ||
      (mergedProps.apm!.isEnabled! && !mergedProps.apm!.isSocketEnabled!);
    const isSocketRequired =
      (mergedProps.dogstatsd!.isEnabled! && mergedProps.dogstatsd!.isSocketEnabled!) ||
      (mergedProps.apm!.isEnabled! && mergedProps.apm!.isSocketEnabled!);

    return {
      ...mergedProps,
      envVarManager: new ManagedInstancesEnvVarManager(mergedProps, isSocketRequired, isProtocolRequired),
      datadogSecret: getSecretApiKey(this, mergedProps),
      isSocketRequired,
      isProtocolRequired,
    };
  }
}
