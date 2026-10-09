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

    it("leaves appDdSocketsVolume/appDdSocketsMountPoint undefined", () => {
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);

      expect(construct.appDdSocketsVolume).toBeUndefined();
      expect(construct.appDdSocketsMountPoint).toBeUndefined();
    });

    it("points the application helpers at the daemon bridge address", () => {
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);

      expect(construct.dogstatsdEnvironment).toEqual([{ name: "DD_AGENT_HOST", value: "169.254.172.2" }]);
      expect(construct.apmEnvironment).toEqual([{ name: "DD_TRACE_AGENT_URL", value: "http://169.254.172.2:8126" }]);
    });

    it("does not emit the same variable name from both helpers", () => {
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const names = [...construct.dogstatsdEnvironment, ...construct.apmEnvironment].map((e) => e.name);

      expect(new Set(names).size).toBe(names.length);
    });

    it("returns empty helpers when the features are disabled", () => {
      datadogProps = { ...datadogProps, dogstatsd: { isEnabled: false }, apm: { isEnabled: false } };
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);

      expect(construct.dogstatsdEnvironment).toEqual([]);
      expect(construct.apmEnvironment).toEqual([]);
    });

    it("sets the non-local-traffic vars on the agent container, without DD_AGENT_HOST", () => {
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.arrayWith([
              Match.objectEquals({ Name: "DD_DOGSTATSD_NON_LOCAL_TRAFFIC", Value: "true" }),
              Match.objectEquals({ Name: "DD_APM_NON_LOCAL_TRAFFIC", Value: "true" }),
            ]),
          }),
        ]),
      });
      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.not(Match.arrayWith([Match.objectLike({ Name: "DD_AGENT_HOST" })])),
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
      expect(construct.apmEnvironment).toEqual([{ name: "DD_TRACE_AGENT_URL", value: "http://169.254.172.2:8126" }]);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.arrayWith([
              Match.objectEquals({ Name: "DD_APM_NON_LOCAL_TRAFFIC", Value: "true" }),
              Match.objectEquals({ Name: "DD_DOGSTATSD_URL", Value: "unix:///var/run/datadog/dsd.socket" }),
            ]),
          }),
        ]),
      });
    });
  });

  describe("explicit enable/disable of APM and DogStatsD on the agent", () => {
    it("sets DD_APM_ENABLED and DD_USE_DOGSTATSD to true by default", () => {
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.arrayWith([
              Match.objectEquals({ Name: "DD_APM_ENABLED", Value: "true" }),
              Match.objectEquals({ Name: "DD_USE_DOGSTATSD", Value: "true" }),
            ]),
          }),
        ]),
      });
    });

    it("sets DD_APM_ENABLED and DD_USE_DOGSTATSD to false when the features are disabled", () => {
      datadogProps = {
        ...datadogProps,
        apm: { isEnabled: false },
        dogstatsd: { isEnabled: false },
        orchestratorExplorer: { isEnabled: false },
      };
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.arrayWith([
              Match.objectEquals({ Name: "DD_CRI_SOCKET_PATH", Value: "/var/run/containerd/containerd.sock" }),
              Match.objectEquals({ Name: "DD_APM_ENABLED", Value: "false" }),
              Match.objectEquals({ Name: "DD_USE_DOGSTATSD", Value: "false" }),
              Match.objectEquals({ Name: "DD_ECS_TASK_COLLECTION_ENABLED", Value: "false" }),
            ]),
          }),
        ]),
      });
    });

    it("does not set origin detection variables when DogStatsD is disabled", () => {
      datadogProps = { ...datadogProps, dogstatsd: { isEnabled: false, isOriginDetectionEnabled: true } };
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.not(Match.arrayWith([Match.objectLike({ Name: "DD_DOGSTATSD_ORIGIN_DETECTION" })])),
          }),
        ]),
      });
    });

    it("disables each feature independently", () => {
      datadogProps = { ...datadogProps, apm: { isEnabled: false } };
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.arrayWith([
              Match.objectEquals({ Name: "DD_APM_ENABLED", Value: "false" }),
              Match.objectEquals({ Name: "DD_USE_DOGSTATSD", Value: "true" }),
            ]),
          }),
        ]),
      });
    });
  });

  describe("apmEnvironment profiling and inferred proxy services", () => {
    it("adds DD_PROFILING_ENABLED when apm.isProfilingEnabled is true", () => {
      datadogProps = { ...datadogProps, apm: { isEnabled: true, isProfilingEnabled: true } };
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      expect(construct.apmEnvironment).toEqual([
        { name: "DD_TRACE_AGENT_URL", value: "unix:///var/run/datadog/apm.socket" },
        { name: "DD_PROFILING_ENABLED", value: "true" },
      ]);
    });

    it("adds DD_TRACE_INFERRED_PROXY_SERVICES_ENABLED when apm.traceInferredProxyServices is true", () => {
      datadogProps = { ...datadogProps, apm: { isEnabled: true, traceInferredProxyServices: true } };
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      expect(construct.apmEnvironment).toEqual([
        { name: "DD_TRACE_AGENT_URL", value: "unix:///var/run/datadog/apm.socket" },
        { name: "DD_TRACE_INFERRED_PROXY_SERVICES_ENABLED", value: "true" },
      ]);
    });

    it("does not add either variable by default", () => {
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      expect(construct.apmEnvironment).toEqual([
        { name: "DD_TRACE_AGENT_URL", value: "unix:///var/run/datadog/apm.socket" },
      ]);
    });

    it("adds them independently of apm.isSocketEnabled", () => {
      datadogProps = {
        ...datadogProps,
        apm: { isEnabled: true, isSocketEnabled: false, isProfilingEnabled: true, traceInferredProxyServices: true },
      };
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      expect(construct.apmEnvironment).toEqual([
        { name: "DD_TRACE_AGENT_URL", value: "http://169.254.172.2:8126" },
        { name: "DD_PROFILING_ENABLED", value: "true" },
        { name: "DD_TRACE_INFERRED_PROXY_SERVICES_ENABLED", value: "true" },
      ]);
    });

    it("is empty when apm.isEnabled is false, even if they are set", () => {
      datadogProps = {
        ...datadogProps,
        apm: { isEnabled: false, isProfilingEnabled: true, traceInferredProxyServices: true },
      };
      const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      expect(construct.apmEnvironment).toEqual([]);
    });

    it("does not set them on the Datadog Agent container itself", () => {
      datadogProps = {
        ...datadogProps,
        apm: { isEnabled: true, isProfilingEnabled: true, traceInferredProxyServices: true },
      };
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.not(
              Match.arrayWith([
                Match.objectLike({ Name: Match.stringLikeRegexp("DD_PROFILING_ENABLED|DD_TRACE_INFERRED_PROXY") }),
              ]),
            ),
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
