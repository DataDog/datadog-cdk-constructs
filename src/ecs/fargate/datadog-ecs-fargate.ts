/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import {
  ContainerImage,
  Protocol,
  ContainerDefinition,
  FirelensLogRouterType,
  TaskDefinition,
  FargateTaskDefinition,
} from "aws-cdk-lib/aws-ecs";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { CfnTaskDefinition } from "aws-cdk-lib/aws-ecs/lib/ecs.generated";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import log from "loglevel";
import { DatadogEcsFargateDefaultProps, FargateDefaultEnvVars } from "./constants";
import {
  DatadogECSFargateInternalProps,
  DatadogECSFargateProps,
  entryPointPrefixCWS,
  isOperatingSystemLinux,
  mergeFargateProps,
  validateECSProps,
} from "../../index";
import { EnvVarManager } from "../environment";

export class DatadogEcsFargate extends Construct {
  scope: Construct;
  props: DatadogECSFargateProps;

  constructor(scope: Construct, id: string, props: DatadogECSFargateProps) {
    if (process.env.DD_CONSTRUCT_DEBUG_LOGS?.toLowerCase() === "true") {
      log.setLevel("debug");
    }
    super(scope, id);
    this.scope = scope;
    this.props = mergeFargateProps(DatadogEcsFargateDefaultProps, props);
  }

  public editFargateTasks(taskDefinitions: FargateTaskDefinition[], props: DatadogECSFargateProps = {}): void {
    taskDefinitions.forEach((taskDefinition) => {
      this.editFargateTask(taskDefinition, props);
    });
  }

  private getCompleteProps(
    task: FargateTaskDefinition,
    taskLevelProps: DatadogECSFargateProps,
  ): DatadogECSFargateInternalProps {
    const mergedProps = mergeFargateProps(this.props, taskLevelProps);
    const isLinux = isOperatingSystemLinux(task);
    const completeProps = {
      ...mergedProps,
      envVarManager: this.configureEnvVarManager(mergedProps),
      isLinux: isLinux,
    };
    return completeProps;
  }

  private configureEnvVarManager(props: DatadogECSFargateProps): EnvVarManager {
    const envVarManager = new EnvVarManager(FargateDefaultEnvVars);
    envVarManager.addAll(props.environmentVariables);

    // TODO: Check if there are any other envvars that need to be added
    envVarManager.add("DD_API_KEY", props.apiKey);
    envVarManager.add("DD_ENV", props.env);
    envVarManager.add("DD_SERVICE", props.service);
    envVarManager.add("DD_VERSION", props.version);
    envVarManager.add("DD_TAGS", props.globalTags);

    if (props.enableDogstatsdOriginDetection) {
      envVarManager.add("DD_DOGSTATSD_ORIGIN_DETECTION", "true");
      envVarManager.add("DD_DOGSTATSD_ORIGIN_DETECTION_CLIENT", "true");
    }

    return envVarManager;
  }

  /**
   * Edits the task definition to include the Datadog agent
   * @param task The fargate task definition to be instrumented
   * @param taskProps Optional properties for task specific configuration
   */
  private editFargateTask(task: FargateTaskDefinition, taskProps: DatadogECSFargateProps = {}): void {
    // Setting up props
    const props = this.getCompleteProps(task, taskProps);
    validateECSProps(props);

    // Add container needed configuration to all application containers
    this.applyAgentConfiguration(task, props);

    // Create the agent container
    const agentContainer = this.createAgentContainer(task, props);

    // Make the application containers depend on the agent container
    if (props.isDatadogEssential && props.isHealthCheckEnabled) {
      this.addContainerDependency(task, agentContainer);
    }

    if (props.enableLogCollection && props.isLinux) {
      // Add the log container configuration to all application containers + agent container
      this.applyLinuxLogConfiguration(task, props);

      // Create the log container
      const logContainer = this.createLogContainer(task, props);

      // Make the application containers + agent container depend on the log container
      if (props.isLogRouterHealthCheckEnabled) {
        this.addContainerDependency(task, logContainer);
      }
    }

    // Required permissions for Agent's ecs_fargate check
    this.configureEcsPolicies(task);
  }

  private addContainerDependency(task: TaskDefinition, container: ContainerDefinition) {
    const containerDefinitions = task.node.children.filter(
      (c) => c instanceof ecs.ContainerDefinition,
    ) as ecs.ContainerDefinition[];
    for (const containerDefinition of containerDefinitions) {
      if (containerDefinition === container) {
        continue;
      }

      // Only add a dependency if the agent is essential and health checks are enabled
      containerDefinition.addContainerDependencies({
        container: container,
        condition: ecs.ContainerDependencyCondition.HEALTHY,
      });
    }
  }

  private applyAgentConfiguration(task: FargateTaskDefinition, props: DatadogECSFargateInternalProps) {
    const requiresSocket =
      (props.enableDogstatsd && props.enableDogstatsdSocket) || (props.enableAPM && props.enableAPMSocket);
    const requiresProtocol =
      (props.enableDogstatsd && !props.enableDogstatsdSocket) || (props.enableAPM && !props.enableAPMSocket);

    // Task-level configurations
    if (requiresSocket && props.isLinux) {
      task.addVolume({
        name: "dd-sockets",
      });
    }

    let cwsContainer: ecs.ContainerDefinition;
    if (props.enableCWS) {
      cwsContainer = task.addContainer("cws-instrumentation", {
        containerName: "cws-instrumentation-init",
        image: ContainerImage.fromRegistry("datadog/cws-instrumentation:latest"),
        user: "0",
        essential: false,
        command: ["/cws-instrumentation", "setup", "--cws-volume-mount", "/cws-instrumentation-volume"],
      });
      task.addVolume({
        name: "cws-instrumentation-volume",
      });
      cwsContainer.addMountPoints({
        sourceVolume: "cws-instrumentation-volume",
        containerPath: "/cws-instrumentation-volume",
        readOnly: false,
      });
    }

    const containerDefinitions = task.node.children.filter(
      (c) => c instanceof ecs.ContainerDefinition,
    ) as ecs.ContainerDefinition[];
    for (const container of containerDefinitions) {
      if (props.isLinux) {
        // DogstatsD + APM configuration UDS
        if (requiresSocket) {
          container.addMountPoints({
            containerPath: "/var/run/datadog",
            sourceVolume: "dd-sockets",
            readOnly: false,
          });
          if (props.enableDogstatsd && props.enableDogstatsdSocket) {
            container.addEnvironment("DD_DOGSTATSD_URL", "unix:///var/run/datadog/dsd.socket");
          }
          if (props.enableAPM && props.enableAPMSocket) {
            container.addEnvironment("DD_TRACE_AGENT_URL", "unix:///var/run/datadog/apm.socket");
          }
        }
      } else {
        // Windows configuration
        // container.addMountPoints({
        //   containerPath: "",
        //   sourceVolume: "dd-sockets",
        //   readOnly: false,
        // });
        // if (props.enableDogStatsdPipe) {
        //   container.addEnvironment("DD_DOGSTATSD_PIPE", "\\\\.\\pipe\\datadog.dsd.socket");
        // }
        // if (props.enableTracePipe) {
        //   container.addEnvironment("DD_TRACE_AGENT_PIPE", "\\\\.\\pipe\\datadog.apm.socket");
        // }
      }

      // Backup DogstatsD + APM configuration for UDP/TCP
      // Works for both Linux and Windows environments
      if (requiresProtocol) {
        container.addEnvironment("DD_AGENT_HOST", "127.0.0.1");
      }

      // CWS Configuration:
      if (props.enableCWS) {
        const containerProps = (container as any).props as ecs.ContainerDefinitionProps;
        if (
          containerProps === undefined ||
          containerProps.entryPoint === undefined ||
          containerProps.entryPoint.length === 0
        ) {
          log.debug("No entrypoint found. Not adding CWS configuration.");
          continue;
        }

        const currentEntryPoint = containerProps.entryPoint as string[];
        currentEntryPoint.unshift(...entryPointPrefixCWS);
        (container as any).props.entryPoint = currentEntryPoint;

        if (container.linuxParameters === undefined) {
          (container as any).linuxParameters = new ecs.LinuxParameters(this.scope, "LinuxParameters", {});
        }
        container.linuxParameters?.addCapabilities(ecs.Capability.SYS_PTRACE);

        container.addMountPoints({
          sourceVolume: "cws-instrumentation-volume",
          containerPath: "/cws-instrumentation-volume",
          readOnly: false,
        });

        container.addContainerDependencies({
          container: cwsContainer!,
          condition: ecs.ContainerDependencyCondition.SUCCESS,
        });
      }

      // Universal Service Tagging configuration:
      if (props.env) {
        container.addEnvironment("DD_ENV", props.env);
        container.addDockerLabel("com.datadoghq.tags.env", props.env);
      }
      if (props.service) {
        container.addEnvironment("DD_SERVICE", props.service);
        container.addDockerLabel("com.datadoghq.tags.service", props.service);
      }
      if (props.version) {
        container.addEnvironment("DD_VERSION", props.version);
        container.addDockerLabel("com.datadoghq.tags.version", props.version);
      }
    }
  }

  private createAgentContainer(task: TaskDefinition, props: DatadogECSFargateInternalProps): ContainerDefinition {
    const agentContainer = task.addContainer(`datadog-agent-${task.family}`, {
      image: ContainerImage.fromRegistry(`${props.registry}:${props.imageVersion}`),
      containerName: "datadog-agent",
      environment: props.envVarManager.retrieveAll(),
      essential: props.isDatadogEssential,
      healthCheck: props.isHealthCheckEnabled ? props.datadogHealthCheck : undefined,
      secrets: this.getSecretApiKey(props),
      portMappings: [
        {
          containerPort: 8125,
          hostPort: 8125,
          protocol: Protocol.UDP,
        },
        {
          containerPort: 8126,
          hostPort: 8126,
          protocol: Protocol.TCP,
        },
      ],
      memoryLimitMiB: props.memoryLimitMiB,
      // workingDirectory: props.isLinux ? undefined : "C:\\",
    });

    // DogStatsD/Trace UDS configuration
    if ((props.enableDogstatsd && props.enableDogstatsdSocket) || (props.enableAPM && props.enableAPMSocket)) {
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

  private createLogContainer(task: TaskDefinition, props: DatadogECSFargateInternalProps): ContainerDefinition {
    const fluentbitContainer = task.addFirelensLogRouter(`fluentBit-${task.family}`, {
      containerName: "log-router",
      image: ecs.ContainerImage.fromRegistry(
        `${props.logDriverConfiguration!.registry}:${props.logDriverConfiguration!.imageVersion}`,
      ),
      essential: props.isLogRouterHealthCheckEnabled,
      firelensConfig: {
        type: FirelensLogRouterType.FLUENTBIT,
        options: {
          enableECSLogMetadata: true,
        },
      },
      memoryReservationMiB: 50,
      healthCheck: props.isLogRouterHealthCheckEnabled ? props.logRouterHealthCheck : undefined,
    });
    return fluentbitContainer;
  }

  /**
   * Applies the fluentbit / awsfirelens configuration to the task definition
   * to support log forwarding to datadog.
   * @param task
   */
  private applyLinuxLogConfiguration(task: TaskDefinition, props: DatadogECSFargateInternalProps) {
    const cfnTaskDefinition = task.node.defaultChild as CfnTaskDefinition;
    const numberOfContainerDefinitions = task.node.children.filter((c) => c instanceof ecs.ContainerDefinition).length;
    for (let index = 0; index < numberOfContainerDefinitions; index++) {
      cfnTaskDefinition.addPropertyOverride(`ContainerDefinitions.${index}.LogConfiguration.LogDriver`, "awsfirelens");
      cfnTaskDefinition.addPropertyOverride(`ContainerDefinitions.${index}.LogConfiguration.Options`, {
        Name: "datadog",
        Host: props.logDriverConfiguration!.hostEndpoint,
        dd_service: props.logDriverConfiguration!.serviceName,
        dd_source: props.logDriverConfiguration!.sourceName,
        dd_message_key: props.logDriverConfiguration!.messageKey,
        dd_tags: props.envVarManager.retrieve("DD_TAGS"), //TODO: Should we manually add others like region, env, service, version, etc?
        TLS: "on",
        provider: "ecs",
        apikey: props.apiKey,
        retry_limit: "2",
      });
      if (props.apiKeySecret) {
        cfnTaskDefinition.addPropertyOverride(`ContainerDefinitions.${index}.LogConfiguration.SecretOptions`, [
          { Name: "apikey", ValueFrom: props.apiKeySecret.secretArn },
        ]);
      }
    }
    // TODO: include configuraiton for log filtering (including/excluding logs)
  }

  private getSecretApiKey(props: DatadogECSFargateProps): Record<string, ecs.Secret> | undefined {
    if (props.apiKeySecret) {
      return { DD_API_KEY: ecs.Secret.fromSecretsManager(props.apiKeySecret) };
    } else if (props.apiKeySecretArn) {
      const secret = secretsmanager.Secret.fromSecretCompleteArn(this.scope, "DatadogSecret", props.apiKeySecretArn);
      return { DD_API_KEY: ecs.Secret.fromSecretsManager(secret) };
    } else {
      return undefined;
    }
  }

  private configureEcsPolicies(task: TaskDefinition) {
    task.addToTaskRolePolicy(
      new iam.PolicyStatement({
        actions: ["ecs:ListClusters", "ecs:ListContainerInstances", "ecs:DescribeContainerInstances"],
        resources: ["*"],
      }),
    );
  }
}
