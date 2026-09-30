import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import * as ecsDatadog from "../../../src/ecs";

describe("DatadogECSManagedInstancesDaemonTaskDefinition - agent container", () => {
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

  it("creates the daemon task definition with the agent container", () => {
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.resourceCountIs("AWS::ECS::DaemonTaskDefinition", 1);
    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      Family: "test-family",
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "datadog-agent",
          Image: "public.ecr.aws/datadog/agent:latest",
          Essential: true,
        }),
      ]),
    });
  });

  it("configures task-level and container-level cpu/memory", () => {
    datadogProps = {
      ...datadogProps,
      taskCpu: "256",
      taskMemory: "512",
      cpu: 128,
      memoryLimitMiB: 256,
    };
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      Cpu: "256",
      Memory: "512",
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "datadog-agent",
          Cpu: 128,
          Memory: 256,
        }),
      ]),
    });
  });

  it("mounts containerd, proc, and cgroup with matching volumes using default paths", () => {
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "datadog-agent",
          MountPoints: Match.arrayWith([
            Match.objectEquals({
              SourceVolume: "containerd_sock",
              ContainerPath: "/var/run/containerd/containerd.sock",
              ReadOnly: true,
            }),
            Match.objectEquals({
              SourceVolume: "proc",
              ContainerPath: "/host/proc",
              ReadOnly: true,
            }),
            Match.objectEquals({
              SourceVolume: "cgroup",
              ContainerPath: "/host/sys/fs/cgroup",
              ReadOnly: true,
            }),
          ]),
        }),
      ]),
      Volumes: Match.arrayWith([
        Match.objectEquals({
          Name: "containerd_sock",
          Host: { SourcePath: "/var/run/containerd/containerd.sock" },
        }),
        Match.objectEquals({
          Name: "proc",
          Host: { SourcePath: "/proc/" },
        }),
        Match.objectEquals({
          Name: "cgroup",
          Host: { SourcePath: "/sys/fs/cgroup/" },
        }),
      ]),
    });
  });

  it("uses custom criSocketPath/procPath/cgroupPath for the host volumes", () => {
    datadogProps = {
      ...datadogProps,
      criSocketPath: "/custom/containerd.sock",
      procPath: "/custom/proc/",
      cgroupPath: "/custom/cgroup/",
    };
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      Volumes: Match.arrayWith([
        Match.objectEquals({ Name: "containerd_sock", Host: { SourcePath: "/custom/containerd.sock" } }),
        Match.objectEquals({ Name: "proc", Host: { SourcePath: "/custom/proc/" } }),
        Match.objectEquals({ Name: "cgroup", Host: { SourcePath: "/custom/cgroup/" } }),
      ]),
    });
  });

  it("adds user-provided volumes to the task without auto-mounting them", () => {
    datadogProps = {
      ...datadogProps,
      volumes: [{ name: "extra-volume", hostPath: "/extra/path" }],
    };
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      Volumes: Match.arrayWith([Match.objectEquals({ Name: "extra-volume", Host: { SourcePath: "/extra/path" } })]),
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "datadog-agent",
          MountPoints: Match.not(Match.arrayWith([Match.objectLike({ SourceVolume: "extra-volume" })])),
        }),
      ]),
    });
  });

  it("sends the API key as a Secrets entry when apiKeySecret is provided", () => {
    const secret = new secretsmanager.Secret(stack, "MySecret");
    datadogProps = {
      family: "test-family",
      apiKeySecret: secret,
      clusterArn: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
      capacityProviderArns: ["arn:aws:ecs:us-east-1:123456789012:capacity-provider/test-cp"],
    };
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "datadog-agent",
          Secrets: Match.arrayWith([
            Match.objectLike({
              Name: "DD_API_KEY",
            }),
          ]),
          Environment: Match.not(Match.arrayWith([Match.objectLike({ Name: "DD_API_KEY" })])),
        }),
      ]),
    });
  });

  it("sends the API key as a plaintext Environment entry when apiKey is provided", () => {
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "datadog-agent",
          Environment: Match.arrayWith([Match.objectEquals({ Name: "DD_API_KEY", Value: "test-api-key" })]),
          Secrets: Match.absent(),
        }),
      ]),
    });
  });

  it("creates an execution role and a task role when none are provided", () => {
    const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::IAM::Role", {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([Match.objectLike({ Principal: { Service: "ecs-tasks.amazonaws.com" } })]),
      }),
      ManagedPolicyArns: Match.arrayWith([
        Match.objectLike({
          "Fn::Join": Match.arrayWith([Match.arrayWith([Match.stringLikeRegexp("AmazonECSTaskExecutionRolePolicy")])]),
        }),
      ]),
    });

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      ExecutionRoleArn: {
        "Fn::GetAtt": [stack.getLogicalId(construct.executionRole.node.defaultChild as cdk.CfnElement), "Arn"],
      },
      TaskRoleArn: {
        "Fn::GetAtt": [stack.getLogicalId(construct.taskRole.node.defaultChild as cdk.CfnElement), "Arn"],
      },
    });
  });

  it("reuses provided task and execution roles instead of creating new ones", () => {
    const customExecutionRole = new iam.Role(stack, "CustomExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });
    const customTaskRole = new iam.Role(stack, "CustomTaskRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });
    datadogProps = {
      ...datadogProps,
      executionRole: customExecutionRole,
      taskRole: customTaskRole,
    };
    const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    expect(construct.executionRole).toBe(customExecutionRole);
    expect(construct.taskRole).toBe(customTaskRole);

    // Only the two explicitly-created roles should exist - no extras were created by the construct.
    template.resourceCountIs("AWS::IAM::Role", 2);

    // Custom execution role does not get the AmazonECSTaskExecutionRolePolicy managed policy attached.
    template.hasResourceProperties("AWS::IAM::Role", {
      RoleName: Match.absent(),
      ManagedPolicyArns: Match.absent(),
    });
  });

  it("attaches the expected inline policy actions to the task role", () => {
    const construct = new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: [
              "ecs:ListClusters",
              "ecs:ListContainerInstances",
              "ecs:DescribeContainerInstances",
              "ecs:DescribeTasks",
              "ecs:ListTasks",
            ],
            Effect: "Allow",
            Resource: "*",
          }),
          Match.objectLike({
            Action: ["ec2:DescribeInstances", "ec2:DescribeTags"],
            Effect: "Allow",
            Resource: "*",
          }),
        ]),
      },
      Roles: Match.arrayWith([{ Ref: stack.getLogicalId(construct.taskRole.node.defaultChild as cdk.CfnElement) }]),
    });
  });

  it("grants the execution role read access to the API key secret", () => {
    const secret = new secretsmanager.Secret(stack, "MySecret");
    datadogProps = {
      family: "test-family",
      apiKeySecret: secret,
      clusterArn: "arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster",
      capacityProviderArns: ["arn:aws:ecs:us-east-1:123456789012:capacity-provider/test-cp"],
    };
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::IAM::Policy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Action: ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"],
            Effect: "Allow",
          }),
        ]),
      },
    });
  });

  it("uses the default health check when none is provided", () => {
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "datadog-agent",
          HealthCheck: {
            Command: ["CMD-SHELL", "agent health"],
            Interval: 30,
            Retries: 3,
            StartPeriod: 15,
            Timeout: 5,
          },
        }),
      ]),
    });
  });

  it("allows overriding the health check", () => {
    datadogProps = {
      ...datadogProps,
      datadogHealthCheck: {
        command: ["CMD-SHELL", "custom-health-check"],
        interval: cdk.Duration.seconds(20),
        retries: 5,
        startPeriod: cdk.Duration.seconds(10),
        timeout: cdk.Duration.seconds(2),
      },
    };
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      ContainerDefinitions: Match.arrayWith([
        Match.objectLike({
          Name: "datadog-agent",
          HealthCheck: {
            Command: ["CMD-SHELL", "custom-health-check"],
            Interval: 20,
            Retries: 5,
            StartPeriod: 10,
            Timeout: 2,
          },
        }),
      ]),
    });
  });

  it("does not set pidMode/ipcMode by default", () => {
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    const resources = template.findResources("AWS::ECS::DaemonTaskDefinition");
    const [resource] = Object.values(resources);
    expect(resource.Properties.PidMode).toBeUndefined();
    expect(resource.Properties.IpcMode).toBeUndefined();
  });

  it("passes through pidMode and ipcMode when set", () => {
    datadogProps = {
      ...datadogProps,
      pidMode: "task",
      ipcMode: "none",
    };
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      PidMode: "task",
      IpcMode: "none",
    });
  });

  it("renders tags on the daemon task definition, always including the cdk construct version tag", () => {
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      Tags: Match.arrayWith([Match.objectLike({ Key: "dd_cdk_construct" })]),
    });
  });

  it("renders custom tags alongside the cdk construct version tag", () => {
    datadogProps = {
      ...datadogProps,
      tags: { team: "test-team", environment: "test" },
    };
    new ecsDatadog.DatadogECSManagedInstancesDaemonTaskDefinition(scope, id, datadogProps);
    const template = Template.fromStack(stack);

    template.hasResourceProperties("AWS::ECS::DaemonTaskDefinition", {
      // The construct's own tag manager (via ITaggableV2) merges the explicit `tags`
      // prop with the CDK construct version tag and sorts the result by key.
      Tags: Match.arrayWith([
        Match.objectLike({ Key: "dd_cdk_construct" }),
        Match.objectEquals({ Key: "environment", Value: "test" }),
        Match.objectEquals({ Key: "team", Value: "test-team" }),
      ]),
    });
  });
});
