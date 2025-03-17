import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
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
            Match.objectLike({
              Name: "DD_API_KEY",
              Value: "test-api-key",
            }),
            Match.objectLike({
              Name: "DD_SITE",
              Value: "datadoghq.eu",
            }),
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
            Match.objectLike({
              Name: "DD_TAGS",
              Value: "tag1:value1,tag2:value2",
            }),
            Match.objectLike({
              Name: "DD_CLUSTER_NAME",
              Value: "test-cluster",
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
            "tags.datadoghq.com/env": "test-env",
            "tags.datadoghq.com/service": "test-service",
            "tags.datadoghq.com/version": "test-version",
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
});
