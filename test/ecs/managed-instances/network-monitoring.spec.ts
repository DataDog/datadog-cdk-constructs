import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { Construct } from "constructs";
import * as ecsDatadog from "../../../src/ecs";

describe("DatadogECSManagedInstancesDaemonTaskDefinition - network monitoring", () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let scope: Construct;
  let id: string;
  let datadogProps: ecsDatadog.DatadogECSManagedInstancesProps;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, "TestStack");

    scope = stack;
    id = "TestTaskDefinition";
    datadogProps = {
      family: "test-family",
      apiKey: "test-api-key",
      clusterArn: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
      capacityProviderArns: ["arn:aws:ecs:us-east-1:123456789012:capacity-provider/test-cp"],
    };
  });

  it("does not add the debug volume, mount, linuxParameters, or env var by default", () => {
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      Volumes: Match.not(Match.arrayWith([Match.objectLike({ Name: "debug" })])),
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "datadog-agent",
          MountPoints: Match.not(Match.arrayWith([Match.objectLike({ SourceVolume: "debug" })])),
          LinuxParameters: Match.absent(),
          Environment: Match.not(Match.arrayWith([Match.objectLike({ Name: "DD_SYSTEM_PROBE_NETWORK_ENABLED" })])),
        }),
      ]),
    });
  });

  it("does not add anything when networkMonitoring.isEnabled is explicitly false", () => {
    datadogProps = {
      ...datadogProps,
      networkMonitoring: { isEnabled: false },
    };
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      Volumes: Match.not(Match.arrayWith([Match.objectLike({ Name: "debug" })])),
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "datadog-agent",
          LinuxParameters: Match.absent(),
        }),
      ]),
    });
  });

  it("adds the debug volume, mount point, linuxParameters capabilities, and env var when enabled", () => {
    datadogProps = {
      ...datadogProps,
      networkMonitoring: { isEnabled: true },
    };
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      Volumes: Match.arrayWith([Match.objectEquals({ Name: "debug", Host: { SourcePath: "/sys/kernel/debug" } })]),
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "datadog-agent",
          MountPoints: Match.arrayWith([
            Match.objectEquals({ SourceVolume: "debug", ContainerPath: "/sys/kernel/debug", ReadOnly: false }),
          ]),
          LinuxParameters: {
            Capabilities: {
              Add: [
                "SYS_ADMIN",
                "SYS_RESOURCE",
                "SYS_PTRACE",
                "NET_ADMIN",
                "NET_BROADCAST",
                "NET_RAW",
                "IPC_LOCK",
                "CHOWN",
              ],
            },
          },
          Environment: Match.arrayWith([
            Match.objectEquals({ Name: "DD_SYSTEM_PROBE_NETWORK_ENABLED", Value: "true" }),
          ]),
        }),
      ]),
    });
  });
});
