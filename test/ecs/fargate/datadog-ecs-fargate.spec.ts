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

  it("should add env, service, version environment variables and Docker labels", () => {
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
});
