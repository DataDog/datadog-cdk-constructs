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
import { DatadogEcsFargateDefaultProps, EntryPointPrefixCWS, DatadogAgentServiceName } from "./constants";
import { FargateEnvVarManager } from "./environment";
import { DatadogECSFargateProps, LoggingType } from "./interfaces";
import { mergeFargateProps, validateECSFargateProps } from "./utils";
import {
  addCdkConstructVersionTag,
  configureEcsPolicies,
  getSecretApiKey,
  isOperatingSystemLinux,
  validateECSBaseProps,
} from "../utils";
import { DatadogECSFargateInternalProps } from "./internal.interfaces";

/**
 * The Datadog ECS Fargate construct manages the Datadog
 * configuration for ECS Fargate tasks.
 */
export class DatadogECSFargate {
  private readonly datadogProps: DatadogECSFargateProps;

  constructor(datadogProps: DatadogECSFargateProps) {
    this.datadogProps = datadogProps;
  }

  /**
   * Creates a new Fargate Task Definition instrumented with Datadog.
   * Merges the provided task's datadogProps with the class's datadogProps.
   * @param scope
   * @param id
   * @param props optional: Fargate Task Definition properties
   * @param datadogProps optional: Datadog ECS Fargate properties override values
   */
  public fargateTaskDefinition(
    scope: Construct,
    id: string,
    props?: ecs.FargateTaskDefinitionProps,
    datadogProps?: DatadogECSFargateProps,
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
    props?: ecs.FargateTaskDefinitionProps,
    datadogProps?: DatadogECSFargateProps,
  ) {
    super(scope, id, props);
    this.scope = scope;

    // Merge and validate datadog props
    this.datadogProps = this.getCompleteProps(props, datadogProps);
    validateECSBaseProps(this.datadogProps);
    validateECSFargateProps(this.datadogProps);

    this.datadogContainer = this.createAgentContainer(this.datadogProps);

    if (this.datadogProps.isLinux && this.datadogProps.readOnlyRootFilesystem) {
      this.addVolume({
        name: "agent-config",
      });
      this.addVolume({
        name: "agent-tmp",
      });
      this.addVolume({
        name: "agent-run",
      });

      const initContainers = this.thisCreateInitContainer(this.datadogProps);
      this.datadogContainer.addContainerDependencies({
        container: initContainers,
        condition: ecs.ContainerDependencyCondition.SUCCESS,
      });
    }

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
      if (instrumentedProps.linuxParameters === undefined && instrumentedProps.entryPoint !== undefined) {
        instrumentedProps.linuxParameters = new ecs.LinuxParameters(this, `LinuxParameters-${id}`, {});
        instrumentedProps.linuxParameters.addCapabilities(ecs.Capability.SYS_PTRACE);
      }
      if (instrumentedProps.entryPoint !== undefined) {
        instrumentedProps.entryPoint.unshift(...EntryPointPrefixCWS);
      } else {
        log.debug("Failed to add CWS entrypoint for container:", id);
      }
    }

    // Log configuration on props
    if (this.datadogProps.logCollection!.isEnabled) {
      if (props.logging === undefined) {
        // Allow users to define their own logging configurations per container
        instrumentedProps.logging = this.createLogDriver();
      } else {
        log.debug("Using custom logging configuration for container: ", id);
      }
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
    if (
      this.datadogProps.logCollection!.isEnabled &&
      this.datadogProps.logCollection!.loggingType === LoggingType.FLUENTBIT &&
      this.datadogProps.logCollection!.fluentbitConfig!.isLogRouterDependencyEnabled
    ) {
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

    // APM configuration
    const traceInferredServices = this.datadogProps.apm!.traceInferredProxyServices;
    if (this.datadogProps.apm!.isEnabled && traceInferredServices !== undefined) {
      container.addEnvironment("DD_TRACE_INFERRED_PROXY_SERVICES_ENABLED", traceInferredServices.toString());
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

    if (this.datadogProps.apm!.isEnabled) {
      if (this.datadogProps.apm!.isProfilingEnabled) {
        container.addEnvironment("DD_PROFILING_ENABLED", "true");
      }
    }

    // Universal Service Tagging configuration:
    if (this.datadogProps.env) {
      container.addEnvironment("DD_ENV", this.datadogProps.env);
      container.addDockerLabel("com.datadoghq.tags.env", this.datadogProps.env);
    }
    if (this.datadogProps.service) {
      container.addEnvironment("DD_SERVICE", this.datadogProps.service);
      container.addDockerLabel("com.datadoghq.tags.service", this.datadogProps.service);
    }
    if (this.datadogProps.version) {
      container.addEnvironment("DD_VERSION", this.datadogProps.version);
      container.addDockerLabel("com.datadoghq.tags.version", this.datadogProps.version);
    }
  }

  private thisCreateInitContainer(props: DatadogECSFargateInternalProps): ecs.ContainerDefinition {
    const initVolumeContainer = super.addContainer("init-volume", {
      image: ecs.ContainerImage.fromRegistry(`${props.registry}:${props.imageVersion}`),
      containerName: "init-volume",
      cpu: 0,
      memoryLimitMiB: 128,
      essential: false,
      readonlyRootFilesystem: true,
      command: ["/bin/sh", "-c", "cp -nR /etc/datadog-agent/* /agent-config/ && exit 0"],
    });

    initVolumeContainer.addMountPoints({
      sourceVolume: "agent-config",
      containerPath: "/agent-config",
      readOnly: false,
    });

    return initVolumeContainer;
  }

  private createAgentContainer(props: DatadogECSFargateInternalProps): ecs.ContainerDefinition {
    const agentContainer = super.addContainer(`datadog-agent-${this.family}`, {
      image: ecs.ContainerImage.fromRegistry(`${props.registry}:${props.imageVersion}`),
      containerName: DatadogAgentServiceName,
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
      environment: props.envVarManager.retrieveAll(),
      essential: props.isDatadogEssential,
      healthCheck: props.datadogHealthCheck,
      readonlyRootFilesystem: props.readOnlyRootFilesystem,
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
      logging:
        props.logCollection!.isEnabled && props.isLinux ? this.createLogDriver(DatadogAgentServiceName) : undefined,
    });

    if (props.isLinux && props.readOnlyRootFilesystem) {
      agentContainer.addMountPoints(
        {
          sourceVolume: "agent-config",
          containerPath: "/etc/datadog-agent",
          readOnly: false,
        },
        {
          sourceVolume: "agent-tmp",
          containerPath: "/tmp",
          readOnly: false,
        },
        {
          sourceVolume: "agent-run",
          containerPath: "/opt/datadog-agent/run",
          readOnly: false,
        },
      );
    }

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
    const fluentbitConfig = props.logCollection!.fluentbitConfig;
    const fluentbitContainer = this.addFirelensLogRouter(`fluent-bit-${this.family}`, {
      containerName: "datadog-log-router",
      image: ecs.ContainerImage.fromRegistry(`${fluentbitConfig!.registry}:${fluentbitConfig!.imageVersion}`),
      cpu: fluentbitConfig!.cpu,
      memoryLimitMiB: fluentbitConfig!.memoryLimitMiB,
      essential: fluentbitConfig!.isLogRouterEssential,
      firelensConfig: {
        type: ecs.FirelensLogRouterType.FLUENTBIT,
        options: fluentbitConfig!.firelensOptions,
      },
      healthCheck: fluentbitConfig!.logRouterHealthCheck,
    });
    return fluentbitContainer;
  }

  private createLogDriver(serviceName?: string): ecs.FireLensLogDriver | undefined {
    if (this.datadogProps.logCollection!.loggingType !== LoggingType.FLUENTBIT) {
      return undefined;
    }

    const fluentbitConfig = this.datadogProps.logCollection!.fluentbitConfig!;
    if (fluentbitConfig.firelensLogDriver) {
      return fluentbitConfig.firelensLogDriver;
    }

    // Otherwise, create a FireLenseLogDriver using the provided config
    const fluentbitLogDriverConfig = fluentbitConfig.logDriverConfig!;
    const logServiceName = serviceName ?? fluentbitLogDriverConfig.serviceName;

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
        ...(fluentbitLogDriverConfig.hostEndpoint !== undefined && {
          Host: fluentbitLogDriverConfig.hostEndpoint,
        }),
        ...(fluentbitLogDriverConfig.tls !== undefined && {
          TLS: fluentbitLogDriverConfig.tls,
        }),
        ...(logServiceName !== undefined && {
          dd_service: logServiceName,
        }),
        ...(fluentbitLogDriverConfig.sourceName !== undefined && {
          dd_source: fluentbitLogDriverConfig.sourceName,
        }),
        ...(fluentbitLogDriverConfig.messageKey !== undefined && {
          dd_message_key: fluentbitLogDriverConfig.messageKey,
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
    taskProps: ecs.FargateTaskDefinitionProps | undefined,
    datadogProps: DatadogECSFargateProps | undefined,
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
