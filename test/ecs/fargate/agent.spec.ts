import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import * as ecsDatadog from "../../../src/ecs";

describe("DatadogECSFargateTaskDefinition", () => {
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
      env: "test-env",
      service: "test-service",
      version: "test-version",
      readOnlyRootFilesystem: true,
    };
  });

  it("creates the agent container", () => {
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    expect(task.datadogContainer).toBeDefined();
    expect(task.logContainer).toBeUndefined();
    expect(task.cwsContainer).toBeUndefined();

    // Validate that the agent container is created
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: task.datadogContainer.containerName,
          Image: task.datadogContainer.imageName,
        }),
      ]),
    });
  });

  it("should add environment variables to the agent container", () => {
    datadogProps = {
      ...datadogProps,
      site: "datadoghq.eu",
      env: "test-env",
      service: "test-service",
      version: "test-version",
      globalTags: "tag1:value1,tag2:value2",
      checksCardinality: ecsDatadog.Cardinality.ORCHESTRATOR,
      environmentVariables: {
        DD_TAGS: "old1:value1,old2:value2", // should be overwritten
        DD_CUSTOM_ENV_VAR: "custom-value",
      },
      clusterName: "test-cluster",
    };

    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the environment variables are added to the agent container
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: task.datadogContainer.containerName,
          Environment: Match.arrayWith([
            Match.objectEquals({
              Name: "DD_TAGS",
              Value: "tag1:value1,tag2:value2",
            }),
            Match.objectEquals({
              Name: "DD_CUSTOM_ENV_VAR",
              Value: "custom-value",
            }),
            Match.objectEquals({
              Name: "DD_API_KEY",
              Value: "test-api-key",
            }),
            Match.objectEquals({
              Name: "DD_SITE",
              Value: "datadoghq.eu",
            }),
            Match.objectEquals({
              Name: "DD_ENV",
              Value: "test-env",
            }),
            Match.objectEquals({
              Name: "DD_SERVICE",
              Value: "test-service",
            }),
            Match.objectEquals({
              Name: "DD_VERSION",
              Value: "test-version",
            }),
            Match.objectEquals({
              Name: "DD_CHECKS_TAG_CARDINALITY",
              Value: ecsDatadog.Cardinality.ORCHESTRATOR,
            }),
            Match.objectEquals({
              Name: "DD_CLUSTER_NAME",
              Value: "test-cluster",
            }),
            Match.objectEquals({
              Name: "DD_ECS_TASK_COLLECTION_ENABLED",
              Value: "true",
            }),
          ]),
        }),
      ]),
    });
  });

  it("adds the correct IAM policies to the task role for ecs fargate agent check", () => {
    const taskDefinition = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the task role has the expected IAM policy
    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: ["ecs:ListClusters", "ecs:ListContainerInstances", "ecs:DescribeContainerInstances"],
            Effect: "Allow",
            Resource: "*",
          }),
        ]),
      },
      // Ensure that the policy is attached to the task role
      Roles: Match.arrayWith([
        {
          Ref: stack.getLogicalId(taskDefinition.taskRole.node.defaultChild as cdk.CfnElement),
        },
      ]),
    });
  });

  it("should configure environment variables for Orchestrator Explorer", () => {
    datadogProps = {
      ...datadogProps,
      orchestratorExplorer: {
        isEnabled: false,
        url: "https://test-orchestrator-explorer.datadoghq.com",
      },
    };
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    console.log(JSON.stringify(template.toJSON(), null, 2));

    // Validate that the environment variables are added to the agent container
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: task.datadogContainer.containerName,
          Environment: Match.arrayWith([
            Match.objectEquals({
              Name: "DD_ECS_TASK_COLLECTION_ENABLED",
              Value: "false",
            }),
            Match.objectEquals({
              Name: "DD_ORCHESTRATOR_EXPLORER_ORCHESTRATOR_DD_URL",
              Value: "https://test-orchestrator-explorer.datadoghq.com",
            }),
          ]),
        }),
      ]),
    });
  });

  it("should add env, service, version environment variables and Docker labels to application containers", () => {
    datadogProps = {
      ...datadogProps,
      env: "test-env",
      service: "test-service",
      version: "test-version",
    };
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    task.addContainer("TestContainer", {
      containerName: "test-container",
      image: ecs.ContainerImage.fromRegistry("registry/image:version"),
    });
    const template = Template.fromStack(stack);

    // Validate that the environment variables and Docker labels are added
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "test-container",
          Environment: Match.arrayWith([
            Match.objectLike({
              Name: "DD_ENV",
              Value: "test-env",
            }),
            Match.objectLike({
              Name: "DD_SERVICE",
              Value: "test-service",
            }),
            Match.objectLike({
              Name: "DD_VERSION",
              Value: "test-version",
            }),
          ]),
          DockerLabels: Match.objectLike({
            "com.datadoghq.tags.env": "test-env",
            "com.datadoghq.tags.service": "test-service",
            "com.datadoghq.tags.version": "test-version",
          }),
        }),
      ]),
    });
  });

  it("should add container dependency on agent container when dependency flag enabled", () => {
    datadogProps = {
      ...datadogProps,
      isDatadogDependencyEnabled: true,
    };
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const container = task.addContainer("TestContainer", {
      containerName: "test-container",
      image: ecs.ContainerImage.fromRegistry("registry/image:version"),
    });
    const template = Template.fromStack(stack);

    // Validate that the environment variables and Docker labels are added
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: container.containerName,
          DependsOn: Match.arrayWith([
            {
              Condition: "HEALTHY",
              ContainerName: task.datadogContainer!.containerName,
            },
          ]),
        }),
      ]),
    });
  });

  it("should add a custom health check to the Datadog Agent container", () => {
    datadogProps = {
      ...datadogProps,
      datadogHealthCheck: {
        command: ["CMD-SHELL", "curl -f http://localhost:8126 || exit 1"],
        interval: cdk.Duration.seconds(35),
        timeout: cdk.Duration.seconds(5),
        retries: 7,
        startPeriod: cdk.Duration.seconds(10),
      },
    };

    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the custom health check is added to the Datadog Agent container
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: task.datadogContainer.containerName,
          HealthCheck: {
            Command: ["CMD-SHELL", "curl -f http://localhost:8126 || exit 1"],
            Interval: 35,
            Timeout: 5,
            Retries: 7,
            StartPeriod: 10,
          },
        }),
      ]),
    });
  });

  it("should have writable volume mounts for ROFS directories in the Datadog Agent and init container", () => {
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the volume mounts are read only
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: task.datadogContainer.containerName,
          MountPoints: Match.arrayWith([
            Match.objectLike({
              SourceVolume: "agent-config",
              ContainerPath: "/etc/datadog-agent",
              ReadOnly: false,
            }),
            Match.objectLike({
              SourceVolume: "agent-tmp",
              ContainerPath: "/tmp",
              ReadOnly: false,
            }),
            Match.objectLike({
              SourceVolume: "agent-run",
              ContainerPath: "/opt/datadog-agent/run",
              ReadOnly: false,
            }),
          ]),
        }),
        Match.objectLike({
          Name: "init-volume",
          MountPoints: Match.arrayWith([
            Match.objectLike({
              SourceVolume: "agent-config",
              ContainerPath: "/agent-config",
              ReadOnly: false,
            }),
          ]),
        }),
      ]),
    });
  });

  it("should not create init container or ROFS volumes when readOnlyRootFilesystem is disabled", () => {
    const datadogPropsWithoutROFS = {
      ...datadogProps,
      readOnlyRootFilesystem: false,
    };
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogPropsWithoutROFS);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.not(
        Match.arrayWith([
          Match.objectLike({
            Name: "init-volume",
          }),
        ]),
      ),
    });

    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: task.datadogContainer.containerName,
          ReadonlyRootFilesystem: false,
        }),
      ]),
    });

    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      Volumes: Match.not(
        Match.arrayWith([
          Match.objectLike({
            Name: "agent-config",
          }),
          Match.objectLike({
            Name: "agent-tmp",
          }),
          Match.objectLike({
            Name: "agent-run",
          }),
        ]),
      ),
    });
  });
});
