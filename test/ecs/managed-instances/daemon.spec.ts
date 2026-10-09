import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { Construct } from "constructs";
import * as ecsDatadog from "../../../src/ecs";

describe("DatadogECSManagedInstancesDaemonTaskDefinition - AWS::ECS::Daemon", () => {
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

  it("creates the AWS::ECS::Daemon resource by default (createDaemon defaults to true)", () => {
    const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    expect(construct.daemon).toBeDefined();
    template.resourceCountIs("AWS::ECS::Daemon", 1);
    template.hasResourceProperties("AWS::ECS::Daemon", {
      DaemonName: "test-family-datadog-agent",
      ClusterArn: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
      CapacityProviderArns: ["arn:aws:ecs:us-east-1:123456789012:capacity-provider/test-cp"],
    });
  });

  it("does not create the AWS::ECS::Daemon resource when createDaemon is false", () => {
    datadogProps = {
      family: "test-family",
      apiKey: "test-api-key",
      createDaemon: false,
    };
    const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    expect(construct.daemon).toBeUndefined();
    template.resourceCountIs("AWS::ECS::Daemon", 0);
    template.resourceCountIs("AWS::ECS::DaemonTaskDefinition", 1);
  });

  it("uses a custom daemonName when provided", () => {
    datadogProps = { ...datadogProps, daemonName: "custom-daemon-name" };
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::Daemon", {
      DaemonName: "custom-daemon-name",
    });
  });

  it("wires multiple capacityProviderArns and the clusterArn through", () => {
    datadogProps = {
      ...datadogProps,
      capacityProviderArns: [
        "arn:aws:ecs:us-east-1:123456789012:capacity-provider/test-cp-1",
        "arn:aws:ecs:us-east-1:123456789012:capacity-provider/test-cp-2",
      ],
    };
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::Daemon", {
      CapacityProviderArns: [
        "arn:aws:ecs:us-east-1:123456789012:capacity-provider/test-cp-1",
        "arn:aws:ecs:us-east-1:123456789012:capacity-provider/test-cp-2",
      ],
    });
  });

  it("defaults propagateTags, enableEcsManagedTags, and enableExecuteCommand", () => {
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::Daemon", {
      PropagateTags: "DAEMON",
      EnableECSManagedTags: true,
      EnableExecuteCommand: false,
    });
  });

  it("allows overriding propagateTags, enableEcsManagedTags, and enableExecuteCommand", () => {
    datadogProps = {
      ...datadogProps,
      propagateTags: "TASK_DEFINITION",
      enableEcsManagedTags: false,
      enableExecuteCommand: true,
    };
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::Daemon", {
      PropagateTags: "TASK_DEFINITION",
      EnableECSManagedTags: false,
      EnableExecuteCommand: true,
    });
  });

  describe("deploymentConfiguration", () => {
    it("defaults drainPercent to 25 and bakeTimeInMinutes to 0, with alarms disabled and no alarm names", () => {
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::Daemon", {
        DeploymentConfiguration: {
          DrainPercent: 25,
          BakeTimeInMinutes: 0,
          Alarms: {
            AlarmNames: [],
            Enable: false,
          },
        },
      });
    });

    it("allows overriding drainPercent and bakeTimeInMinutes while preserving default alarms", () => {
      datadogProps = {
        ...datadogProps,
        deploymentConfiguration: {
          drainPercent: 50,
          bakeTimeInMinutes: 10,
        },
      };
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::Daemon", {
        DeploymentConfiguration: {
          DrainPercent: 50,
          BakeTimeInMinutes: 10,
          Alarms: {
            AlarmNames: [],
            Enable: false,
          },
        },
      });
    });

    it("allows overriding the alarms block", () => {
      datadogProps = {
        ...datadogProps,
        deploymentConfiguration: {
          alarms: {
            alarmNames: ["alarm-1", "alarm-2"],
            enable: true,
          },
        },
      };
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::Daemon", {
        DeploymentConfiguration: {
          DrainPercent: 25,
          BakeTimeInMinutes: 0,
          Alarms: {
            AlarmNames: ["alarm-1", "alarm-2"],
            Enable: true,
          },
        },
      });
    });
  });

  describe("validation errors", () => {
    it("throws when family is undefined", () => {
      datadogProps = { ...datadogProps, family: undefined as unknown as string };
      expect(() => new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps)).toThrow(
        /family/,
      );
    });

    it("throws when family is an empty string", () => {
      datadogProps = { ...datadogProps, family: "" };
      expect(() => new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps)).toThrow(
        /family/,
      );
    });

    it("throws when clusterArn is missing and createDaemon is true", () => {
      datadogProps = { ...datadogProps, clusterArn: undefined };
      expect(() => new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps)).toThrow(
        /clusterArn/,
      );
    });

    it("throws when capacityProviderArns is an empty array and createDaemon is true", () => {
      datadogProps = { ...datadogProps, capacityProviderArns: [] };
      expect(() => new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps)).toThrow(
        /capacityProviderArns/,
      );
    });

    it("throws when capacityProviderArns is undefined and createDaemon is true", () => {
      datadogProps = { ...datadogProps, capacityProviderArns: undefined };
      expect(() => new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps)).toThrow(
        /capacityProviderArns/,
      );
    });

    it("throws when logCollection.isEnabled is true", () => {
      datadogProps = { ...datadogProps, logCollection: { isEnabled: true } };
      expect(() => new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps)).toThrow(
        /log collection/i,
      );
    });

    it("does not require clusterArn/capacityProviderArns when createDaemon is false", () => {
      datadogProps = {
        family: "test-family",
        apiKey: "test-api-key",
        createDaemon: false,
      };
      expect(
        () => new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps),
      ).not.toThrow();
    });
  });
});
