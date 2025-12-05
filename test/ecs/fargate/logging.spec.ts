import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import * as ecsDatadog from "../../../src/ecs";
import { ParseJsonFirelensConfigFileType } from "../../../src/ecs/fargate/constants";

describe("DatadogECSFargateLogging", () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let scope: Construct;
  let id: string;
  let props: ecs.FargateTaskDefinitionProps;
  let datadogProps: ecsDatadog.DatadogECSFargateProps;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, "TestStack");

    scope = stack; // Use the stack as the construct scope
    id = "TestTaskDefinition";
    props = {
      family: "test-family",
      cpu: 256,
      memoryLimitMiB: 512,
    };
    datadogProps = {
      registry: "public.ecr.aws/datadog/agent",
      imageVersion: "latest",
      apiKey: "test-api-key",
      readOnlyRootFilesystem: true,
      logCollection: {
        isEnabled: true,
        fluentbitConfig: {
          logDriverConfig: {
            hostEndpoint: "http-intake.logs.datadoghq.com-test",
          },
          registry: "public.ecr.aws/aws-observability/aws-for-fluent-bit",
          imageVersion: "stable",
        },
      },
    };
  });

  it("creates the log container when log collection is enabled", () => {
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // assert that the logContainer is defined
    expect(task.logContainer).toBeDefined();

    // Validate that the log container is created
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Image: "public.ecr.aws/aws-observability/aws-for-fluent-bit:stable",
          FirelensConfiguration: {
            Type: "fluentbit",
            Options: {
              "enable-ecs-log-metadata": "true",
            },
          },
        }),
      ]),
    });
  });

  it("does not create the log container when log collection is disabled", () => {
    // Disable log collection
    datadogProps = {
      ...datadogProps,
      logCollection: {
        isEnabled: false,
      },
    };
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // assert the log container is not defined
    expect(task.logContainer).toBeUndefined();

    // Validate that the log container is not created
    template.resourceCountIs("AWS::ECS::TaskDefinition", 1);
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: [
        {
          Name: "datadog-agent",
        },
        {
          Name: "init-volume",
        },
      ],
    });
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.not(
        Match.arrayWith([
          Match.objectLike({
            Name: "datadog-log-router",
          }),
        ]),
      ),
    });
  });

  it("sets the correct log driver configuration on the agent container", () => {
    datadogProps = {
      ...datadogProps,
      clusterName: "test-cluster",
      environmentVariables: {
        DD_TAGS: "team:cont-p",
      },
      logCollection: {
        isEnabled: true,
        fluentbitConfig: {
          logDriverConfig: {
            tls: "on",
            serviceName: "service-test",
            sourceName: "source-test",
            messageKey: "message-test",
          },
        },
      },
      apiKeySecretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:my-secret-name-AbCdEf",
    };

    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the log driver configuration is set correctly
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Image: task.datadogContainer.imageName,
          LogConfiguration: {
            LogDriver: "awsfirelens",
            Options: Match.objectLike({
              Name: "datadog",
              Host: "http-intake.logs.datadoghq.com",
              TLS: "on",
              provider: "ecs",
              dd_tags: "team:cont-p, ecs_cluster_name:test-cluster",
              dd_message_key: "message-test",
              dd_service: "datadog-agent",
              dd_source: "source-test",
            }),
          },
        }),
      ]),
    });

    // Log driver is not applied to the log router itself
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Image: "public.ecr.aws/aws-observability/aws-for-fluent-bit:stable",
          LogConfiguration: Match.absent(),
        }),
      ]),
    });
  });

  it("sets the correct log driver configuration on application containers", () => {
    datadogProps = {
      ...datadogProps,
      logCollection: {
        isEnabled: true,
        fluentbitConfig: {
          logDriverConfig: {
            serviceName: "global-service-name",
          },
        },
      },
    };

    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const container = task.addContainer("app-container", {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
    });
    const template = Template.fromStack(stack);

    // Validate app container has global service name
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: container.containerName,
          LogConfiguration: {
            LogDriver: "awsfirelens",
            Options: Match.objectLike({
              dd_service: "global-service-name",
            }),
          },
        }),
      ]),
    });
  });

  it("does not override existing log driver configuration", () => {
    datadogProps = {
      ...datadogProps,
      logCollection: {
        isEnabled: true,
      },
    };
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);

    // Add container with existing log driver
    const container = task.addContainer("app-container", {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: "test" }),
    });

    const template = Template.fromStack(stack);

    // Validate that the existing logging configuration is preserved
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: container.containerName,
          LogConfiguration: {
            LogDriver: "awslogs",
            Options: Match.objectLike({
              "awslogs-stream-prefix": "test",
            }),
          },
        }),
      ]),
    });
  });

  it("creates container dependency on log router when enabled dependency", () => {
    datadogProps = {
      logCollection: {
        isEnabled: true,
        fluentbitConfig: {
          isLogRouterDependencyEnabled: true,
        },
      },
    };
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const container = task.addContainer("app-container", {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: container.containerName,
          DependsOn: Match.arrayWith([
            {
              Condition: "HEALTHY",
              ContainerName: task.logContainer!.containerName,
            },
          ]),
        }),
      ]),
    });
  });

  it("configures the log container with provided values", () => {
    datadogProps = {
      ...datadogProps,
      logCollection: {
        isEnabled: true,
        fluentbitConfig: {
          cpu: 256,
          memoryLimitMiB: 2048,
          registry: "public.ecr.aws/aws-observability/aws-for-fluent-bit",
          imageVersion: "latest-v2",
        },
      },
    };

    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the log container is configured with the custom cpu and memory values
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: task.logContainer!.containerName,
          Cpu: 256,
          Memory: 2048,
          Image: "public.ecr.aws/aws-observability/aws-for-fluent-bit:latest-v2",
        }),
      ]),
    });
  });

  it("configures the log container with json formatting", () => {
    datadogProps = {
      ...datadogProps,
      logCollection: {
        isEnabled: true,
        fluentbitConfig: {
          firelensOptions: {
            isParseJson: true,
            configFileValue: "this/value/should/be/overridden.conf",
          },
        },
      },
    };

    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the log container is configured with the custom cpu and memory values
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: task.logContainer!.containerName,
          FirelensConfiguration: {
            Type: "fluentbit",
            Options: {
              "enable-ecs-log-metadata": "true",
              "config-file-type": "file",
              "config-file-value": "/fluent-bit/configs/parse-json.conf",
            },
          },
        }),
      ]),
    });
  });

  it("configures the log container with firelensOptions", () => {
    datadogProps = {
      ...datadogProps,
      logCollection: {
        isEnabled: true,
        fluentbitConfig: {
          firelensOptions: {
            isParseJson: false,
            configFileType: ParseJsonFirelensConfigFileType,
            configFileValue: "some/other/value.conf",
          },
        },
      },
    };

    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the log container is configured with the custom cpu and memory values
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: task.logContainer!.containerName,
          FirelensConfiguration: {
            Type: "fluentbit",
            Options: {
              "enable-ecs-log-metadata": "true",
              "config-file-type": "file",
              "config-file-value": "some/other/value.conf",
            },
          },
        }),
      ]),
    });
  });

  it("configures log driver using provided FireLensLogDriver", () => {
    datadogProps = {
      ...datadogProps,
      logCollection: {
        isEnabled: true,
        fluentbitConfig: {
          firelensLogDriver: new ecs.FireLensLogDriver({
            options: {
              Name: "custom-firelens",
              provider: "ecs",
              TLS: "on",
              Host: "http-intake.logs.datadoghq.com-test",
            },
          }),
        },
      },
    };

    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Image: task.datadogContainer.imageName,
          LogConfiguration: {
            LogDriver: "awsfirelens",
            Options: Match.objectLike({
              Name: "custom-firelens",
              Host: "http-intake.logs.datadoghq.com-test",
              TLS: "on",
              provider: "ecs",
            }),
          },
        }),
      ]),
    });
  });

  it("configures log driver with provided FireLensLogDriver even if logDriverConfig is set", () => {
    datadogProps = {
      ...datadogProps,
      logCollection: {
        isEnabled: true,
        fluentbitConfig: {
          firelensLogDriver: new ecs.FireLensLogDriver({
            options: {
              Name: "custom-firelens",
              provider: "ecs",
              TLS: "on",
              Host: "http-intake.logs.datadoghq.com-test",
            },
          }),
          logDriverConfig: {
            tls: "off",
            hostEndpoint: "http-intake.logs.datadoghq.com",
          },
        },
      },
    };

    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Image: task.datadogContainer.imageName,
          LogConfiguration: {
            LogDriver: "awsfirelens",
            Options: Match.objectLike({
              Name: "custom-firelens",
              Host: "http-intake.logs.datadoghq.com-test",
              TLS: "on",
              provider: "ecs",
            }),
          },
        }),
      ]),
    });
  });
});
