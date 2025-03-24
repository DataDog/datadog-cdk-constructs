/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as ecs from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import log from "loglevel";
import { DatadogEcsFargateDefaultProps } from "./constants";
import { FargateEnvVarManager } from "./environment";
import { DatadogECSFargateInternalProps, DatadogECSFargateProps, LoggingType } from "./interfaces";
import { mergeFargateProps, validateECSFargateProps } from "./utils";
import { entryPointPrefixCWS } from "../constants";
import {
  addCdkConstructVersionTag,
  configureEcsPolicies,
  getSecretApiKey,
  isOperatingSystemLinux,
  validateECSBaseProps,
} from "../utils";

/**
 * The Datadog ECS Fargate construct manages the Datadog
 * configuration for ECS Fargate tasks.
 */
export class DatadogECSFargate {
  private readonly datadogProps: DatadogECSFargateProps;

  constructor(datadogProps: DatadogECSFargateProps) {
    this.datadogProps = datadogProps;
  }

  public fargateTaskDefinition(
    scope: Construct,
    id: string,
    props: ecs.FargateTaskDefinitionProps,
    datadogProps: DatadogECSFargateProps = {},
  ): DatadogECSFargateTaskDefinition {
    const mergedProps = mergeFargateProps(this.datadogProps, datadogProps);
    return new DatadogECSFargateTaskDefinition(scope, id, props, mergedProps);
  }
}

/**
 * The Datadog ECS Fargate Task Definition automatically instruments the
 * ECS Fargate task and containers with configured Datadog features.
 */
export class DatadogECSFargateTaskDefinition extends ecs.FargateTaskDefinition {
  private readonly scope: Construct;
  private readonly datadogProps: DatadogECSFargateInternalProps;
  public readonly datadogContainer: ecs.ContainerDefinition;
  public readonly logContainer?: ecs.ContainerDefinition;
  public readonly cwsContainer?: ecs.ContainerDefinition;

  constructor(
    scope: Construct,
    id: string,
    props: ecs.FargateTaskDefinitionProps,
    datadogProps: DatadogECSFargateProps,
  ) {
    super(scope, id, props);
    this.scope = scope;

    // Merge and validate datadog props
    this.datadogProps = this.getCompleteProps(props, datadogProps);
    validateECSBaseProps(this.datadogProps);
    validateECSFargateProps(this.datadogProps);

    // Task-level datadog configuration
    this.datadogContainer = this.createAgentContainer(this.datadogProps);

    // Volume for DogStatsD/APM UDS
    if (this.datadogProps.isSocketRequired && this.datadogProps.isLinux) {
      this.addVolume({
        name: "dd-sockets",
      });
    }

    // Volume + Container for CWS
    if (this.datadogProps.cws!.isEnabled) {
      this.addVolume({
        name: "cws-instrumentation-volume",
      });
      this.cwsContainer = this.createCWSContainer();
    }

    // Container for log collection
    if (
      this.datadogProps.logCollection!.isEnabled &&
      this.datadogProps.logCollection!.loggingType === LoggingType.FLUENTBIT
    ) {
      this.logContainer = this.createLogContainer(this.datadogProps);
    }

    configureEcsPolicies(this);
    addCdkConstructVersionTag(this);
  }

  /**
   * Adds a new container to the task definition.
   *
   * Modifies properties of container to support specified agent configuration in task.
   */
  public addContainer(id: string, containerProps: ecs.ContainerDefinitionOptions): ecs.ContainerDefinition {
    const instrumentedProps = this.configureContainerProps(id, containerProps);
    const container = super.addContainer(id, instrumentedProps);
    this.configureContainer(container, instrumentedProps);
    return container;
  }

  /**
   * Modifies the container props to support specified Datadog agent configuration.
   */
  private configureContainerProps(id: string, props: ecs.ContainerDefinitionOptions): ecs.ContainerDefinitionOptions {
    const instrumentedProps = {
      ...props,
    };

    // CWS configuration on props
    if (this.datadogProps.cws!.isEnabled) {
      if (instrumentedProps.linuxParameters === undefined) {
        instrumentedProps.linuxParameters = new ecs.LinuxParameters(this, `LinuxParameters-${id}`, {});
        instrumentedProps.linuxParameters.addCapabilities(ecs.Capability.SYS_PTRACE);
      }
      if (instrumentedProps.entryPoint !== undefined) {
        instrumentedProps.entryPoint.unshift(...entryPointPrefixCWS);
      } else {
        log.debug("Failed to add CWS entrypoint for container:", id);
      }
    }

    // Log configuration on props
    if (
      this.datadogProps.logCollection!.isEnabled &&
      this.datadogProps.logCollection!.logDriverConfiguration !== undefined
    ) {
      if (props.logging !== undefined) {
        log.debug("Overriding logging configuration for container: ", id);
      }
      instrumentedProps.logging = this.createLogDriver();
    }

    return instrumentedProps;
  }

  /**
   * Configures the container to support Datadog agent configuration.
   */
  private configureContainer(container: ecs.ContainerDefinition, props: ecs.ContainerDefinitionOptions): void {
    // Datadog agent container dependencies
    if (this.datadogProps.isDatadogDependencyEnabled && this.datadogProps.datadogHealthCheck !== undefined) {
      container.addContainerDependencies({
        container: this.datadogContainer,
        condition: ecs.ContainerDependencyCondition.HEALTHY,
      });
    }

    // Log container dependencies
    if (this.datadogProps.logCollection!.isEnabled && this.datadogProps.logCollection!.isLogRouterDependencyEnabled) {
      container.addContainerDependencies({
        container: this.logContainer!,
        condition: ecs.ContainerDependencyCondition.HEALTHY,
      });
    }

    // DogStatsD/APM UDS configuration
    if (this.datadogProps.isLinux) {
      if (this.datadogProps.isSocketRequired) {
        container.addMountPoints({
          containerPath: "/var/run/datadog",
          sourceVolume: "dd-sockets",
          readOnly: false,
        });
        if (this.datadogProps.dogstatsd!.isEnabled && this.datadogProps.dogstatsd!.isSocketEnabled) {
          container.addEnvironment("DD_DOGSTATSD_URL", "unix:///var/run/datadog/dsd.socket");
        }
        if (this.datadogProps.apm!.isEnabled && this.datadogProps.apm!.isSocketEnabled) {
          container.addEnvironment("DD_TRACE_AGENT_URL", "unix:///var/run/datadog/apm.socket");
        }
      }
    } else {
      // Windows pipes
    }

    // DogStatsD/APM protocol configuration
    if (this.datadogProps.isProtocolRequired) {
      container.addEnvironment("DD_AGENT_HOST", "127.0.0.1");
    }

    // CWS configuration
    if (this.datadogProps.cws!.isEnabled && props.entryPoint !== undefined) {
      container.addMountPoints({
        sourceVolume: "cws-instrumentation-volume",
        containerPath: "/cws-instrumentation-volume",
        readOnly: false,
      });
      container.addContainerDependencies({
        container: this.cwsContainer!,
        condition: ecs.ContainerDependencyCondition.SUCCESS,
      });
    }

    // Universal Service Tagging configuration:
    if (this.datadogProps.env) {
      container.addEnvironment("DD_ENV", this.datadogProps.env);
      container.addDockerLabel("tags.datadoghq.com/env", this.datadogProps.env);
    }
    if (this.datadogProps.service) {
      container.addEnvironment("DD_SERVICE", this.datadogProps.service);
      container.addDockerLabel("tags.datadoghq.com/service", this.datadogProps.service);
    }
    if (this.datadogProps.version) {
      container.addEnvironment("DD_VERSION", this.datadogProps.version);
      container.addDockerLabel("tags.datadoghq.com/version", this.datadogProps.version);
    }
  }

  private createAgentContainer(props: DatadogECSFargateInternalProps): ecs.ContainerDefinition {
    const agentContainer = super.addContainer(`datadog-agent-${this.family}`, {
      image: ecs.ContainerImage.fromRegistry(`${props.registry}:${props.imageVersion}`),
      containerName: "datadog-agent",
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
      environment: props.envVarManager.retrieveAll(),
      essential: props.isDatadogEssential,
      healthCheck: props.datadogHealthCheck,
      secrets: this.datadogProps.datadogSecret ? { DD_API_KEY: this.datadogProps.datadogSecret! } : undefined,
      portMappings: [
        {
          containerPort: 8125,
          hostPort: 8125,
          protocol: ecs.Protocol.UDP,
        },
        {
          containerPort: 8126,
          hostPort: 8126,
          protocol: ecs.Protocol.TCP,
        },
      ],
      logging: props.logCollection!.isEnabled && props.isLinux ? this.createLogDriver() : undefined,
    });

    // DogStatsD/Trace UDS configuration
    if (props.isSocketRequired) {
      if (props.isLinux) {
        agentContainer.addMountPoints({
          containerPath: "/var/run/datadog",
          sourceVolume: "dd-sockets",
          readOnly: false,
        });
      }
    }

    return agentContainer;
  }

  private createLogContainer(props: DatadogECSFargateInternalProps): ecs.ContainerDefinition {
    const fluentbitContainer = this.addFirelensLogRouter(`fluentBit-${this.family}`, {
      containerName: "datadog-log-router",
      image: ecs.ContainerImage.fromRegistry(
        `${props.logCollection!.logDriverConfiguration!.registry}:${
          props.logCollection!.logDriverConfiguration!.imageVersion
        }`,
      ),
      cpu: props.logCollection!.cpu,
      memoryLimitMiB: props.logCollection!.memoryLimitMiB,
      essential: props.logCollection!.isLogRouterEssential,
      firelensConfig: {
        type: ecs.FirelensLogRouterType.FLUENTBIT,
        options: {
          enableECSLogMetadata: true,
        },
      },
      healthCheck: props.logCollection!.logRouterHealthCheck,
    });
    return fluentbitContainer;
  }

  private createLogDriver(): ecs.FireLensLogDriver | undefined {
    const logCollection = this.datadogProps.logCollection!;

    if (logCollection.logDriverConfiguration === undefined) {
      throw new Error("Log driver configuration is required for log collection.");
    }

    if (logCollection!.loggingType === LoggingType.FLUENTBIT) {
      let logTags = this.datadogProps.envVarManager.retrieve("DD_TAGS");
      if (this.datadogProps.clusterName !== undefined) {
        if (logTags === undefined) {
          logTags = "";
        } else {
          logTags += ", ";
        }
        logTags = logTags.concat("ecs_cluster_name:" + this.datadogProps.clusterName);
      }

      const logDriverProps = {
        options: {
          Name: "datadog",
          provider: "ecs",
          retry_limit: "2",
          ...(logCollection.logDriverConfiguration.hostEndpoint !== undefined && {
            Host: logCollection.logDriverConfiguration.hostEndpoint,
          }),
          ...(logCollection.logDriverConfiguration.tls !== undefined && {
            TLS: logCollection.logDriverConfiguration.tls,
          }),
          ...(logCollection.logDriverConfiguration.serviceName !== undefined && {
            dd_service: logCollection.logDriverConfiguration.serviceName,
          }),
          ...(logCollection.logDriverConfiguration.sourceName !== undefined && {
            dd_source: logCollection.logDriverConfiguration.sourceName,
          }),
          ...(logCollection.logDriverConfiguration.messageKey !== undefined && {
            dd_message_key: logCollection.logDriverConfiguration.messageKey,
          }),
          ...(logTags !== undefined && {
            dd_tags: logTags,
          }),
          ...(this.datadogProps.apiKey !== undefined && {
            apikey: this.datadogProps.apiKey,
          }),
        },
        secretOptions: {
          ...(this.datadogProps.datadogSecret !== undefined && {
            apikey: this.datadogProps.datadogSecret!,
          }),
        },
      };

      return new ecs.FireLensLogDriver(logDriverProps);
    }
    return undefined;
  }

  private createCWSContainer(): ecs.ContainerDefinition {
    const cwsContainer = super.addContainer("cws-instrumentation", {
      containerName: "cws-instrumentation-init",
      image: ecs.ContainerImage.fromRegistry("datadog/cws-instrumentation:latest"),
      cpu: this.datadogProps.cws!.cpu,
      memoryLimitMiB: this.datadogProps.cws!.memoryLimitMiB,
      user: "0",
      essential: false,
      command: ["/cws-instrumentation", "setup", "--cws-volume-mount", "/cws-instrumentation-volume"],
    });
    cwsContainer.addMountPoints({
      sourceVolume: "cws-instrumentation-volume",
      containerPath: "/cws-instrumentation-volume",
      readOnly: false,
    });
    return cwsContainer;
  }

  private getCompleteProps(
    taskProps: ecs.FargateTaskDefinitionProps,
    datadogProps: DatadogECSFargateProps,
  ): DatadogECSFargateInternalProps {
    const mergedProps = mergeFargateProps(DatadogEcsFargateDefaultProps, datadogProps);
    const isLinux = isOperatingSystemLinux(taskProps);
    const isProtocolRequired =
      (mergedProps.dogstatsd!.isEnabled! && !mergedProps.dogstatsd!.isSocketEnabled!) ||
      (mergedProps.apm!.isEnabled! && !mergedProps.apm!.isSocketEnabled!);
    const isSocketRequired =
      (mergedProps.dogstatsd!.isEnabled! && mergedProps.dogstatsd!.isSocketEnabled!) ||
      (mergedProps.apm!.isEnabled! && mergedProps.apm!.isSocketEnabled!);

    const completeProps = {
      ...mergedProps,
      envVarManager: new FargateEnvVarManager(mergedProps),
      datadogSecret: getSecretApiKey(this.scope, mergedProps),
      isLinux: isLinux,
      isProtocolRequired: isProtocolRequired,
      isSocketRequired: isSocketRequired,
    };
    return completeProps;
  }
}
