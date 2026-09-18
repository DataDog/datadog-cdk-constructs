import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { Construct } from "constructs";
import * as ecsDatadog from "../../../src/ecs";

describe("DatadogECSManagedInstancesDaemonTaskDefinition - APM/DogStatsD", () => {
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

  describe("UDS mode (default: dogstatsd + apm sockets enabled)", () => {
    it("adds the dd-sockets volume and mount point to the agent container", () => {
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        Volumes: Match.arrayWith([
          Match.objectEquals({ Name: "dd-sockets", Host: { SourcePath: "/var/run/datadog" } }),
        ]),
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            MountPoints: Match.arrayWith([
              Match.objectEquals({ SourceVolume: "dd-sockets", ContainerPath: "/var/run/datadog", ReadOnly: false }),
            ]),
          }),
        ]),
      });
    });

    it("populates appDdSocketsVolume/appDdSocketsMountPoint/dogstatsdEnvironment/apmEnvironment", () => {
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);

      expect(construct.appDdSocketsVolume).toEqual({ name: "dd-sockets", host: { sourcePath: "/var/run/datadog" } });
      expect(construct.appDdSocketsMountPoint).toEqual({
        sourceVolume: "dd-sockets",
        containerPath: "/var/run/datadog",
        readOnly: true,
      });
      expect(construct.dogstatsdEnvironment).toEqual([
        { name: "DD_DOGSTATSD_URL", value: "unix:///var/run/datadog/dsd.socket" },
      ]);
      expect(construct.apmEnvironment).toEqual([
        { name: "DD_TRACE_AGENT_URL", value: "unix:///var/run/datadog/apm.socket" },
      ]);
    });

    it("sets DD_DOGSTATSD_URL and DD_TRACE_AGENT_URL on the agent container", () => {
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.arrayWith([
              Match.objectEquals({ Name: "DD_DOGSTATSD_URL", Value: "unix:///var/run/datadog/dsd.socket" }),
              Match.objectEquals({ Name: "DD_TRACE_AGENT_URL", Value: "unix:///var/run/datadog/apm.socket" }),
            ]),
          }),
        ]),
      });
    });

    it("does not set DD_AGENT_HOST or non-local-traffic vars", () => {
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.not(
              Match.arrayWith([
                Match.objectLike({ Name: "DD_AGENT_HOST" }),
                Match.objectLike({ Name: "DD_DOGSTATSD_NON_LOCAL_TRAFFIC" }),
                Match.objectLike({ Name: "DD_APM_NON_LOCAL_TRAFFIC" }),
              ]),
            ),
          }),
        ]),
      });
    });
  });

  describe("TCP fallback mode (dogstatsd + apm sockets disabled)", () => {
    beforeEach(() => {
      datadogProps = {
        ...datadogProps,
        dogstatsd: { isEnabled: true, isSocketEnabled: false },
        apm: { isEnabled: true, isSocketEnabled: false },
      };
    });

    it("does not add the dd-sockets volume or mount point", () => {
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        Volumes: Match.not(Match.arrayWith([Match.objectLike({ Name: "dd-sockets" })])),
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            MountPoints: Match.not(Match.arrayWith([Match.objectLike({ SourceVolume: "dd-sockets" })])),
          }),
        ]),
      });
    });

    it("leaves appDdSocketsVolume/appDdSocketsMountPoint/dogstatsdEnvironment/apmEnvironment empty", () => {
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);

      expect(construct.appDdSocketsVolume).toBeUndefined();
      expect(construct.appDdSocketsMountPoint).toBeUndefined();
      expect(construct.dogstatsdEnvironment).toEqual([]);
      expect(construct.apmEnvironment).toEqual([]);
    });

    it("sets DD_AGENT_HOST to the daemon bridge IP and non-local-traffic vars", () => {
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.arrayWith([
              Match.objectEquals({ Name: "DD_AGENT_HOST", Value: "169.254.172.2" }),
              Match.objectEquals({ Name: "DD_DOGSTATSD_NON_LOCAL_TRAFFIC", Value: "true" }),
              Match.objectEquals({ Name: "DD_APM_NON_LOCAL_TRAFFIC", Value: "true" }),
            ]),
          }),
        ]),
      });
    });

    it("does not set the UDS-specific environment variables", () => {
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.not(
              Match.arrayWith([
                Match.objectLike({ Name: "DD_DOGSTATSD_URL" }),
                Match.objectLike({ Name: "DD_TRACE_AGENT_URL" }),
              ]),
            ),
          }),
        ]),
      });
    });
  });

  describe("mixed mode (dogstatsd over socket, apm over TCP)", () => {
    beforeEach(() => {
      datadogProps = {
        ...datadogProps,
        dogstatsd: { isEnabled: true, isSocketEnabled: true },
        apm: { isEnabled: true, isSocketEnabled: false },
      };
    });

    it("requires both the socket volume/mount and the TCP fallback env vars", () => {
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      expect(construct.appDdSocketsVolume).toBeDefined();
      expect(construct.dogstatsdEnvironment).toEqual([
        { name: "DD_DOGSTATSD_URL", value: "unix:///var/run/datadog/dsd.socket" },
      ]);
      expect(construct.apmEnvironment).toEqual([]);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.arrayWith([
              Match.objectEquals({ Name: "DD_AGENT_HOST", Value: "169.254.172.2" }),
              Match.objectEquals({ Name: "DD_APM_NON_LOCAL_TRAFFIC", Value: "true" }),
              Match.objectEquals({ Name: "DD_DOGSTATSD_URL", Value: "unix:///var/run/datadog/dsd.socket" }),
            ]),
          }),
        ]),
      });
    });
  });

  describe("dataStreamsEnvironment", () => {
    it("is empty when apm.dataStreams is not set", () => {
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      expect(construct.dataStreamsEnvironment).toEqual([]);
    });

    it("is empty when apm.dataStreams is true but apm.isEnabled is false", () => {
      datadogProps = { ...datadogProps, apm: { isEnabled: false, dataStreams: true } };
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      expect(construct.dataStreamsEnvironment).toEqual([]);
    });

    it("populates DD_DATA_STREAMS_ENABLED when apm.isEnabled and apm.dataStreams are both true", () => {
      datadogProps = { ...datadogProps, apm: { isEnabled: true, dataStreams: true } };
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      expect(construct.dataStreamsEnvironment).toEqual([{ name: "DD_DATA_STREAMS_ENABLED", value: "true" }]);
    });

    it("is not affected by apm.isSocketEnabled (transport-independent)", () => {
      datadogProps = { ...datadogProps, apm: { isEnabled: true, isSocketEnabled: false, dataStreams: true } };
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      expect(construct.dataStreamsEnvironment).toEqual([{ name: "DD_DATA_STREAMS_ENABLED", value: "true" }]);
    });

    it("is not set as an environment variable on the Datadog Agent container itself", () => {
      datadogProps = { ...datadogProps, apm: { isEnabled: true, dataStreams: true } };
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.not(Match.arrayWith([Match.objectLike({ Name: "DD_DATA_STREAMS_ENABLED" })])),
          }),
        ]),
      });
    });
  });
});
