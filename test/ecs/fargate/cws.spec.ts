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
      isDatadogDependencyEnabled: true,
      cws: {
        isEnabled: true,
      },
    };
  });

  it("creates the CWS container when enabled", () => {
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    expect(task.cwsContainer).toBeDefined();

    // Validate that the CWS container is created
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "cws-instrumentation-init",
          Image: "datadog/cws-instrumentation:latest",
        }),
      ]),
    });
  });

  it("should inject the CWS entry point prefix and add the volume mount", () => {
    const entryPoint = ["/app/start.sh"];
    const taskDefinition = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const containerProps: ecs.ContainerDefinitionOptions = {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 512,
      entryPoint: entryPoint,
    };
    taskDefinition.addContainer("app-container", containerProps);

    // Expected entry point with CWS prefix
    entryPoint.unshift(...ecsDatadog.entryPointPrefixCWS);
    const template = Template.fromStack(stack);

    // Validate that the entry point prefix and volume mount are added
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "app-container",
          EntryPoint: Match.arrayWith(entryPoint),
          MountPoints: Match.arrayWith([
            Match.objectLike({
              ContainerPath: "/cws-instrumentation-volume",
              SourceVolume: "cws-instrumentation-volume",
              ReadOnly: false,
            }),
          ]),
        }),
      ]),
    });
  });

  it("applies CWS container configurations", () => {
    datadogProps = {
      ...datadogProps,
      cws: {
        isEnabled: true,
        cpu: 128,
        memoryLimitMiB: 256,
      },
    };

    const taskDefinition = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the cpu and memory parameters are applied to the CWS container
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: taskDefinition.cwsContainer!.containerName,
          Cpu: 128,
          Memory: 256,
        }),
      ]),
    });
  });
});
