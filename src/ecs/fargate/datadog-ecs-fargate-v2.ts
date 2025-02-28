import * as ecs from "aws-cdk-lib/aws-ecs";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { DatadogEcsFargateDefaultProps, FargateDefaultEnvVars } from "./constants";
import { DatadogECSFargateInternalProps, DatadogECSFargateProps } from "./interfaces";
import { entryPointPrefixCWS } from "../constants";
import { EnvVarManager } from "../environment";
import { isOperatingSystemLinuxV2, mergeFargateProps, validateECSProps } from "../utils";

export class DatadogECSFargate {
  private readonly datadogProps: DatadogECSFargateProps;

  constructor(datadogProps: DatadogECSFargateProps) {
    this.datadogProps = datadogProps;
  }

  public FargateTaskDefinition(
    scope: Construct,
    id: string,
    props: ecs.FargateTaskDefinitionProps,
    datadogProps: DatadogECSFargateProps = {},
  ): DatadogECSFargateTaskDefinition {
    const mergedProps = mergeFargateProps(this.datadogProps, datadogProps);
    return new DatadogECSFargateTaskDefinition(scope, id, props, mergedProps);
  }
}

export class DatadogECSFargateTaskDefinition extends ecs.FargateTaskDefinition {
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

    // Merge and validate datadog props
    this.datadogProps = this.getCompleteProps(props, datadogProps);
    validateECSProps(this.datadogProps);

    // Task-level datadog configuration
    this.datadogContainer = this.createAgentContainer(this.datadogProps);

    // Volume for DogStatsD/APM UDS
    if (this.datadogProps.requiresSocket && this.datadogProps.isLinux) {
      this.addVolume({
        name: "dd-sockets",
      });
    }

    // Volume + Container for CWS
    if (this.datadogProps.enableCWS) {
      this.addVolume({
        name: "cws-instrumentation-volume",
      });
      this.cwsContainer = this.createCWSContainer();
    }

    // Container for log collection
    if (this.datadogProps.enableLogCollection) {
      this.logContainer = this.createLogContainer(this.datadogProps);
      // TODO: agent container logging
    }

    this.configureEcsPolicies();
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
    if (this.datadogProps.enableCWS) {
      if (instrumentedProps.linuxParameters === undefined) {
        instrumentedProps.linuxParameters = new ecs.LinuxParameters(this, `LinuxParameters-${id}`, {});
        instrumentedProps.linuxParameters.addCapabilities(ecs.Capability.SYS_PTRACE);
      }
      if (instrumentedProps.entryPoint !== undefined) {
        instrumentedProps.entryPoint.unshift(...entryPointPrefixCWS);
      } else {
        console.debug("Failed to add CWS entrypoint for container:", id);
      }
    }

    // Log configuration on props
    if (this.datadogProps.enableLogCollection && this.datadogProps.logDriverConfiguration !== undefined) {
      if (props.logging !== undefined) {
        console.debug("Overriding logging configuration for container: ", id);
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
    if (
      this.datadogProps.isHealthCheckEnabled &&
      this.datadogProps.datadogHealthCheck !== undefined &&
      this.datadogProps.isDatadogEssential
    ) {
      container.addContainerDependencies({
        container: this.datadogContainer,
        condition: ecs.ContainerDependencyCondition.HEALTHY,
      });
    }

    // DogStatsD/APM UDS configuration
    if (this.datadogProps.isLinux) {
      if (this.datadogProps.requiresSocket) {
        container.addMountPoints({
          containerPath: "/var/run/datadog",
          sourceVolume: "dd-sockets",
          readOnly: false,
        });
        if (this.datadogProps.enableDogstatsd && this.datadogProps.enableDogstatsdSocket) {
          container.addEnvironment("DD_DOGSTATSD_URL", "unix:///var/run/datadog/dsd.socket");
        }
        if (this.datadogProps.enableAPM && this.datadogProps.enableAPMSocket) {
          container.addEnvironment("DD_TRACE_AGENT_URL", "unix:///var/run/datadog/apm.socket");
        }
      }
    } else {
      // Windows pipes
    }

    // DogStatsD/APM protocol configuration
    if (this.datadogProps.requiresProtocol) {
      container.addEnvironment("DD_AGENT_HOST", "127.0.0.1");
    }

    // CWS configuration
    if (this.datadogProps.enableCWS && props.entryPoint !== undefined) {
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

  private createAgentContainer(props: DatadogECSFargateInternalProps): ecs.ContainerDefinition {
    const agentContainer = super.addContainer(`datadog-agent-${this.family}`, {
      image: ecs.ContainerImage.fromRegistry(`${props.registry}:${props.imageVersion}`),
      containerName: "datadog-agent",
      environment: props.envVarManager.retrieveAll(),
      essential: props.isDatadogEssential,
      healthCheck: props.isHealthCheckEnabled ? props.datadogHealthCheck : undefined,
      secrets: this.getSecretApiKey(props) ? { DD_API_KEY: this.getSecretApiKey(props)! } : undefined,
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
      memoryLimitMiB: props.memoryLimitMiB,
      logging: props.enableLogCollection && props.isLinux ? this.createLogDriver() : undefined,
    });

    // DogStatsD/Trace UDS configuration
    if (props.requiresSocket) {
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
        `${props.logDriverConfiguration!.registry}:${props.logDriverConfiguration!.imageVersion}`,
      ),
      essential: props.isLogRouterHealthCheckEnabled,
      firelensConfig: {
        type: ecs.FirelensLogRouterType.FLUENTBIT,
        options: {
          enableECSLogMetadata: true,
        },
      },
      memoryReservationMiB: 50,
      healthCheck: props.isLogRouterHealthCheckEnabled ? props.logRouterHealthCheck : undefined,
    });
    return fluentbitContainer;
  }

  private createLogDriver(): ecs.FireLensLogDriver {
    if (this.datadogProps.logDriverConfiguration === undefined) {
      throw new Error("Log driver configuration is required for log collection.");
    }

    // TODO: determine if we want to add any extra tags for logs: eg. clusterName.
    const logTags = this.datadogProps.envVarManager.retrieve("DD_TAGS");
    if (logTags !== undefined) {
      if (this.datadogProps.clusterName !== undefined) {
        logTags.concat(" cluster_name:" + this.datadogProps.clusterName);
      }
    }

    const logDriverProps = {
      options: {
        Name: "datadog",
        Host: this.datadogProps.logDriverConfiguration.hostEndpoint!, // TODO: add validation the hostEndpoint exists
        TLS: "on",
        provider: "ecs",
        retry_limit: "2",
        ...(this.datadogProps.logDriverConfiguration.serviceName && {
          dd_service: this.datadogProps.logDriverConfiguration.serviceName,
        }),
        ...(this.datadogProps.logDriverConfiguration.sourceName && {
          dd_source: this.datadogProps.logDriverConfiguration.sourceName,
        }),
        ...(this.datadogProps.logDriverConfiguration.messageKey && {
          dd_message_key: this.datadogProps.logDriverConfiguration.messageKey,
        }),
        ...(logTags !== undefined && {
          dd_tags: logTags,
        }),
        ...(this.datadogProps.apiKey && {
          apikey: this.datadogProps.apiKey,
        }),
      },
      secretOptions: {
        ...(this.getSecretApiKey(this.datadogProps) !== undefined && {
          apikey: this.getSecretApiKey(this.datadogProps)!,
        }),
      },
    };

    return new ecs.FireLensLogDriver(logDriverProps);
  }

  private createCWSContainer(): ecs.ContainerDefinition {
    const cwsContainer = super.addContainer("cws-instrumentation", {
      containerName: "cws-instrumentation-init",
      image: ecs.ContainerImage.fromRegistry("datadog/cws-instrumentation:latest"),
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

  private getSecretApiKey(props: DatadogECSFargateProps): ecs.Secret | undefined {
    if (props.apiKeySecret) {
      return ecs.Secret.fromSecretsManager(props.apiKeySecret);
    } else if (props.apiKeySecretArn) {
      const secret = secretsmanager.Secret.fromSecretCompleteArn(this, "DatadogSecret", props.apiKeySecretArn);
      return ecs.Secret.fromSecretsManager(secret);
    } else {
      return undefined;
    }
  }

  private getCompleteProps(
    taskProps: ecs.FargateTaskDefinitionProps,
    datadogProps: DatadogECSFargateProps,
  ): DatadogECSFargateInternalProps {
    const mergedProps = mergeFargateProps(DatadogEcsFargateDefaultProps, datadogProps);
    const isLinux = isOperatingSystemLinuxV2(taskProps);
    const requiresProtocol =
      (mergedProps.enableDogstatsd && !mergedProps.enableDogstatsdSocket) ||
      (mergedProps.enableAPM && !mergedProps.enableAPMSocket);
    const requiresSocket =
      (mergedProps.enableDogstatsd && mergedProps.enableDogstatsdSocket) ||
      (mergedProps.enableAPM && mergedProps.enableAPMSocket);

    const completeProps = {
      ...mergedProps,
      envVarManager: this.configureEnvVarManager(mergedProps),
      isLinux: isLinux,
      requiresProtocol: requiresProtocol,
      requiresSocket: requiresSocket,
    };
    return completeProps;
  }

  private configureEnvVarManager(props: DatadogECSFargateProps): EnvVarManager {
    const envVarManager = new EnvVarManager(FargateDefaultEnvVars);
    envVarManager.addAll(props.environmentVariables);

    envVarManager.add("DD_API_KEY", props.apiKey);
    envVarManager.add("DD_ENV", props.env);
    envVarManager.add("DD_SERVICE", props.service);
    envVarManager.add("DD_VERSION", props.version);
    envVarManager.add("DD_TAGS", props.globalTags);

    if (props.enableDogstatsdOriginDetection) {
      envVarManager.add("DD_DOGSTATSD_ORIGIN_DETECTION", "true");
      envVarManager.add("DD_DOGSTATSD_ORIGIN_DETECTION_CLIENT", "true");
    }

    if (props.enableCWS) {
      envVarManager.add("DD_RUNTIME_SECURITY_CONFIG_ENABLED", "true");
      envVarManager.add("DD_RUNTIME_SECURITY_CONFIG_EBPFLESS_ENABLED", "true");
    }

    return envVarManager;
  }

  private configureEcsPolicies() {
    this.addToTaskRolePolicy(
      new PolicyStatement({
        actions: ["ecs:ListClusters", "ecs:ListContainerInstances", "ecs:DescribeContainerInstances"],
        resources: ["*"],
      }),
    );
  }
}
