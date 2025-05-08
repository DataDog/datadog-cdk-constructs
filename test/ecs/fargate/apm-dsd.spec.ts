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
      apiKey: "test-api-key",
      dogstatsd: {
        isEnabled: true,
        isSocketEnabled: true,
      },
      apm: {
        isEnabled: true,
        isSocketEnabled: true,
      },
    };
  });

  it("should add volume mounts and environment variables for DogStatsD and APM", () => {
    const taskDefinition = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const containerProps: ecs.ContainerDefinitionOptions = {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 512,
    };
    taskDefinition.addContainer("app-container", containerProps);
    const template = Template.fromStack(stack);

    // Validate that the volume mounts and environment variables are added
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "app-container",
          MountPoints: Match.arrayWith([
            Match.objectLike({
              ContainerPath: "/var/run/datadog",
              SourceVolume: "dd-sockets",
              ReadOnly: false,
            }),
          ]),
          Environment: Match.arrayWith([
            Match.objectLike({
              Name: "DD_DOGSTATSD_URL",
              Value: "unix:///var/run/datadog/dsd.socket",
            }),
            Match.objectLike({
              Name: "DD_TRACE_AGENT_URL",
              Value: "unix:///var/run/datadog/apm.socket",
            }),
          ]),
        }),
      ]),
    });
  });

  it("creates volumes for DogStatsD/APM UDS if necessary", () => {
    const task = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the volume for DogStatsD/APM UDS is added
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: task.datadogContainer.containerName,
          MountPoints: Match.arrayWith([
            Match.objectLike({
              ContainerPath: "/var/run/datadog",
              SourceVolume: "dd-sockets",
              ReadOnly: false,
            }),
          ]),
        }),
      ]),
      Volumes: Match.arrayWith([
        Match.objectLike({
          Name: "dd-sockets",
        }),
      ]),
    });
  });

  it("should add environment variables for DogStatsD when sockets are not enabled", () => {
    datadogProps = {
      ...datadogProps,
      dogstatsd: {
        isEnabled: true,
        isSocketEnabled: false,
      },
      apm: {
        isEnabled: true,
        isSocketEnabled: false,
      },
    };
    const taskDefinition = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const containerProps: ecs.ContainerDefinitionOptions = {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 512,
    };
    taskDefinition.addContainer("app-container", containerProps);
    const template = Template.fromStack(stack);

    // Validate that the environment variables are added
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "app-container",
          Environment: Match.arrayWith([
            Match.objectLike({
              Name: "DD_AGENT_HOST",
              Value: "127.0.0.1",
            }),
          ]),
        }),
      ]),
    });
  });

  it("should configure ports 8125 and 8126 for UDP and TCP on the datadog-agent container when sockets are not enabled", () => {
    datadogProps = {
      ...datadogProps,
      dogstatsd: {
        isEnabled: true,
        isSocketEnabled: false,
      },
      apm: {
        isEnabled: true,
        isSocketEnabled: false,
      },
    };
    const taskDefinition = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the ports are configured on the datadog-agent container
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: taskDefinition.datadogContainer.containerName,
          PortMappings: Match.arrayWith([
            Match.objectLike({
              ContainerPort: 8125,
              Protocol: "udp",
            }),
            Match.objectLike({
              ContainerPort: 8126,
              Protocol: "tcp",
            }),
          ]),
        }),
      ]),
    });
  });

  it("should enable origin detection when isOriginDetectionEnabled is true", () => {
    datadogProps = {
      ...datadogProps,
      dogstatsd: {
        isEnabled: true,
        isOriginDetectionEnabled: true,
      },
    };
    const taskDefinition = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the environment variable for origin detection is added
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: taskDefinition.datadogContainer.containerName,
          Environment: Match.arrayWith([
            Match.objectLike({
              Name: "DD_DOGSTATSD_ORIGIN_DETECTION",
              Value: "true",
            }),
          ]),
        }),
      ]),
    });
  });

  it("should set the DogStatsD cardinality when dogstatsdCardinality is configured", () => {
    datadogProps = {
      ...datadogProps,
      dogstatsd: {
        isEnabled: true,
        dogstatsdCardinality: ecsDatadog.Cardinality.LOW,
      },
    };
    const taskDefinition = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const template = Template.fromStack(stack);

    // Validate that the environment variable for DogStatsD cardinality is added
    template.hasResourceProperties("AWS::ECS::TaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: taskDefinition.datadogContainer.containerName,
          Environment: Match.arrayWith([
            Match.objectLike({
              Name: "DD_DOGSTATSD_TAG_CARDINALITY",
              Value: ecsDatadog.Cardinality.LOW,
            }),
          ]),
        }),
      ]),
    });
  });

  // Helper for parameterized tests
  function createTaskWithApmProps(apmProps: any) {
    datadogProps = {
      ...datadogProps,
      apm: {
        ...datadogProps.apm,
        ...apmProps,
      },
    };
    const taskDefinition = new ecsDatadog.DatadogECSFargateTaskDefinition(scope, id, props, datadogProps);
    const containerProps: ecs.ContainerDefinitionOptions = {
      image: ecs.ContainerImage.fromRegistry("amazon/amazon-ecs-sample"),
      memoryLimitMiB: 512,
    };
    taskDefinition.addContainer("app-container", containerProps);
    return Template.fromStack(stack);
  }

  describe("DD_TRACE_INFERRED_PROXY_SERVICES_ENABLED env var", () => {
    const cases = [
      { isEnabled: true, traceInferredProxyServices: true, shouldSet: true, expectedValue: "true", desc: "isEnabled=true, traceInferredProxyServices=true" },
      { isEnabled: true, traceInferredProxyServices: false, shouldSet: true, expectedValue: "false", desc: "isEnabled=true, traceInferredProxyServices=false" },
      { isEnabled: true, traceInferredProxyServices: undefined, shouldSet: false, expectedValue: undefined, desc: "isEnabled=true, traceInferredProxyServices=undefined" },
      { isEnabled: false, traceInferredProxyServices: true, shouldSet: false, expectedValue: undefined, desc: "isEnabled=false, traceInferredProxyServices=true" },
      { isEnabled: false, traceInferredProxyServices: false, shouldSet: false, expectedValue: undefined, desc: "isEnabled=false, traceInferredProxyServices=false" },
      { isEnabled: false, traceInferredProxyServices: undefined, shouldSet: false, expectedValue: undefined, desc: "isEnabled=false, traceInferredProxyServices=undefined" },
    ];

    test.each(cases)(
      "should %s",
      ({ isEnabled, traceInferredProxyServices, shouldSet, expectedValue, desc }) => {
        const template = createTaskWithApmProps({ isEnabled, traceInferredProxyServices });
        if (shouldSet) {
          template.hasResourceProperties("AWS::ECS::TaskDefinition", {
            ContainerDefinitions: Match.arrayWith([
              Match.objectLike({
                Name: "app-container",
                Environment: Match.arrayWith([
                  Match.objectLike({
                    Name: "DD_TRACE_INFERRED_PROXY_SERVICES_ENABLED",
                    Value: expectedValue,
                  }),
                ]),
              }),
            ]),
          });
        } else {
          template.hasResourceProperties("AWS::ECS::TaskDefinition", {
            ContainerDefinitions: Match.arrayWith([
              Match.objectLike({
                Name: "app-container",
                Environment: Match.not(
                  Match.arrayWith([
                    Match.objectLike({
                      Name: "DD_TRACE_INFERRED_PROXY_SERVICES_ENABLED",
                    }),
                  ])
                ),
              }),
            ]),
          });
        }
      }
    );
  });
});
