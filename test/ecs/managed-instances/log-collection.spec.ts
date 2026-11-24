import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { Construct } from "constructs";
import * as ecsDatadog from "../../../src/ecs";

describe("DatadogECSManagedInstancesDaemonTaskDefinition - log collection", () => {
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

  function synthesizedTaskDefinition() {
    const template = Template.fromStack(stack);
    const [taskDefinition] = Object.values(template.findResources("AWS::ECS::DaemonTaskDefinition"));
    return taskDefinition.Properties;
  }

  describe("when logCollection is enabled", () => {
    beforeEach(() => {
      datadogProps = { ...datadogProps, logCollection: { isEnabled: true } };
    });

    it("sets DD_LOGS_ENABLED and DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL on the agent container", () => {
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            Environment: Match.arrayWith([
              { Name: "DD_LOGS_ENABLED", Value: "true" },
              { Name: "DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL", Value: "true" },
            ]),
          }),
        ]),
      });
    });

    it("mounts the json-file log driver volume read-only at /var/log/ecs/json-file", () => {
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            MountPoints: Match.arrayWith([
              { SourceVolume: "json_file_logs", ContainerPath: "/var/log/ecs/json-file", ReadOnly: true },
            ]),
          }),
        ]),
      });
    });

    it("adds exactly one log driver volume with the json-file driver and no host path", () => {
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const volumes = synthesizedTaskDefinition().Volumes;

      const logDriverVolumes = volumes.filter(
        (volume: { LogDriverVolumeConfiguration?: unknown }) => volume.LogDriverVolumeConfiguration !== undefined,
      );
      expect(logDriverVolumes).toEqual([
        { Name: "json_file_logs", LogDriverVolumeConfiguration: { Driver: "json-file" } },
      ]);
    });

    it("sets LogDriverVolumeConfiguration on the right volume when other managed and user volumes are present", () => {
      datadogProps = {
        ...datadogProps,
        networkMonitoring: { isEnabled: true },
        volumes: [{ name: "extra-certs", hostPath: "/etc/extra-certs" }],
      };
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const volumes = synthesizedTaskDefinition().Volumes;

      expect(volumes.map((volume: { Name: string }) => volume.Name)).toEqual([
        "containerd_sock",
        "proc",
        "cgroup",
        "dd-sockets",
        "debug",
        "json_file_logs",
        "extra-certs",
      ]);
      expect(volumes[5]).toEqual({ Name: "json_file_logs", LogDriverVolumeConfiguration: { Driver: "json-file" } });
      expect(volumes[6]).toEqual({ Name: "extra-certs", Host: { SourcePath: "/etc/extra-certs" } });
    });

    it("matches the daemon task definition in the Datadog documentation sample", () => {
      // Hand-copied from the volumes, mount points and log environment variables of
      // datadog-agent-ecs-managed-instances-daemon-logs.json in DataDog/documentation.
      // Nothing links the two, so update this test if that sample changes.
      datadogProps = {
        ...datadogProps,
        dogstatsd: { isEnabled: false },
        apm: { isEnabled: false },
      };
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const properties = synthesizedTaskDefinition();
      const [agentContainer] = properties.ContainerDefinitions;

      expect(properties.Volumes).toEqual([
        { Name: "containerd_sock", Host: { SourcePath: "/var/run/containerd/containerd.sock" } },
        { Name: "proc", Host: { SourcePath: "/proc/" } },
        { Name: "cgroup", Host: { SourcePath: "/sys/fs/cgroup/" } },
        { Name: "json_file_logs", LogDriverVolumeConfiguration: { Driver: "json-file" } },
      ]);
      expect(agentContainer.MountPoints).toEqual([
        { SourceVolume: "containerd_sock", ContainerPath: "/var/run/containerd/containerd.sock", ReadOnly: true },
        { SourceVolume: "proc", ContainerPath: "/host/proc", ReadOnly: true },
        { SourceVolume: "cgroup", ContainerPath: "/host/sys/fs/cgroup", ReadOnly: true },
        { SourceVolume: "json_file_logs", ContainerPath: "/var/log/ecs/json-file", ReadOnly: true },
      ]);
      expect(agentContainer.Environment).toEqual(
        expect.arrayContaining([
          { Name: "ECS_MANAGED_INSTANCES", Value: "true" },
          { Name: "DD_CRI_SOCKET_PATH", Value: "/var/run/containerd/containerd.sock" },
          { Name: "DD_LOGS_ENABLED", Value: "true" },
          { Name: "DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL", Value: "true" },
        ]),
      );
    });

    it("lets the agent's own logs use the json-file log driver through agentLogConfiguration", () => {
      datadogProps = { ...datadogProps, agentLogConfiguration: { logDriver: "json-file" } };
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({ Name: "datadog-agent", LogConfiguration: { LogDriver: "json-file" } }),
        ]),
      });
    });

    it("throws when a user volume reuses the json_file_logs volume name", () => {
      datadogProps = { ...datadogProps, volumes: [{ name: "json_file_logs", hostPath: "/some/path" }] };
      expect(() => new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps)).toThrow(
        /used by a volume this construct manages/,
      );
    });

    it("throws when a user volume mounts at /var/log/ecs/json-file", () => {
      datadogProps = {
        ...datadogProps,
        volumes: [{ name: "host-logs", hostPath: "/var/log/ecs/json-file" }],
      };
      expect(() => new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps)).toThrow(
        /already mounted in the Datadog Agent container/,
      );
    });
  });

  describe("when logCollection is overridden through daemonTaskDefinition()", () => {
    function logVolumeNames() {
      return synthesizedTaskDefinition()
        .Volumes.filter((volume: { LogDriverVolumeConfiguration?: unknown }) => volume.LogDriverVolumeConfiguration)
        .map((volume: { Name: string }) => volume.Name);
    }

    it("turns log collection off when the override disables it", () => {
      const ecsDatadog2 = new ecsDatadog.DatadogECSManagedInstances({
        ...datadogProps,
        logCollection: { isEnabled: true },
      });
      ecsDatadog2.daemonTaskDefinition(scope, id, { family: "test-family", logCollection: { isEnabled: false } });

      expect(logVolumeNames()).toEqual([]);
      const [agentContainer] = synthesizedTaskDefinition().ContainerDefinitions;
      expect(
        agentContainer.MountPoints.map((mountPoint: { SourceVolume: string }) => mountPoint.SourceVolume),
      ).not.toContain("json_file_logs");
      expect(agentContainer.Environment.map((env: { Name: string }) => env.Name)).not.toContain("DD_LOGS_ENABLED");
    });

    it("turns log collection on when the override enables it", () => {
      const ecsDatadog2 = new ecsDatadog.DatadogECSManagedInstances(datadogProps);
      ecsDatadog2.daemonTaskDefinition(scope, id, { family: "test-family", logCollection: { isEnabled: true } });

      expect(logVolumeNames()).toEqual(["json_file_logs"]);
      const [agentContainer] = synthesizedTaskDefinition().ContainerDefinitions;
      expect(agentContainer.Environment).toEqual(
        expect.arrayContaining([
          { Name: "DD_LOGS_ENABLED", Value: "true" },
          { Name: "DD_LOGS_CONFIG_CONTAINER_COLLECT_ALL", Value: "true" },
        ]),
      );
    });
  });

  describe("when logCollection is not enabled", () => {
    it.each([
      ["not set", undefined],
      ["disabled", { isEnabled: false }],
    ])("adds no log volume, mount or environment variable when logCollection is %s", (_, logCollection) => {
      datadogProps = { ...datadogProps, logCollection };
      new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
      const template = Template.fromStack(stack);

      template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
        Volumes: Match.not(Match.arrayWith([Match.objectLike({ Name: "json_file_logs" })])),
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: "datadog-agent",
            MountPoints: Match.not(Match.arrayWith([Match.objectLike({ SourceVolume: "json_file_logs" })])),
            Environment: Match.not(Match.arrayWith([Match.objectLike({ Name: Match.stringLikeRegexp("^DD_LOGS_") })])),
          }),
        ]),
      });
      const volumes = synthesizedTaskDefinition().Volumes;
      expect(
        volumes.some((volume: { LogDriverVolumeConfiguration?: unknown }) => volume.LogDriverVolumeConfiguration),
      ).toBe(false);
    });

    it("keeps the json_file_logs name and /var/log/ecs/json-file path available to user volumes", () => {
      datadogProps = {
        ...datadogProps,
        volumes: [{ name: "json_file_logs", hostPath: "/var/log/ecs/json-file" }],
      };
      expect(
        () => new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps),
      ).not.toThrow();
    });
  });
});
