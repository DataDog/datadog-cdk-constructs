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
      cws: {
        isEnabled: true,
      },
    };
  });

  it("should inject the CWS entry point prefix and add the volume mount", () => {
    const taskDefinition = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const containerProps: ecs.ContainerDefinitionOptions = {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 512,
      entryPoint: ["/app/start.sh"],
    };
    taskDefinition.addContainer("app-container", containerProps);
    const template = Template.fromStack(stack);

    // Validate that the entry point prefix and volume mount are added
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "app-container",
          EntryPoint: Match.arrayWith([
            "/cws-instrumentation-volume/cws-instrumentation",
            "trace",
            "--",
            "/app/start.sh",
          ]),
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
});
