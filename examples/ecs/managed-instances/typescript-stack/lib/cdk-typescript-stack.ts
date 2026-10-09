import { Stack, StackProps } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import { DatadogECSManagedInstances } from "datadog-cdk-constructs-v2";

export class CdkTypeScriptStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    console.log("Instrumenting an ECS Managed Daemon on ECS Managed Instances with Datadog");

    const vpc = new ec2.Vpc(this, "Vpc", { maxAzs: 2 });

    // Plain L2 ECS cluster. The Datadog construct does not create clusters.
    const cluster = new ecs.Cluster(this, "Cluster", { vpc });

    // The ECS infrastructure role lets ECS launch, manage, and terminate the
    // EC2 instances backing ECS Managed Instances on your behalf.
    const infrastructureRole = new iam.Role(this, "InfrastructureRole", {
      assumedBy: new iam.ServicePrincipal("ecs.amazonaws.com"),
      managedPolicies: [
        // No "service-role/" path segment for this managed policy, unlike
        // most other ECS service-linked policies.
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonECSInfrastructureRolePolicyForManagedInstances"),
      ],
    });

    // The EC2 instance profile role. Its name MUST start with
    // "ecsInstanceRole" - the AWS managed policy
    // AmazonECSInstanceRolePolicyForManagedInstances scopes iam:PassRole to
    // role names matching "ecsInstanceRole*". A CDK-auto-generated role name
    // will not match this pattern and ECS Managed Instances will fail to
    // launch instances.
    const instanceRole = new iam.Role(this, "InstanceRole", {
      roleName: "ecsInstanceRole-example",
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonECSInstanceRolePolicyForManagedInstances")],
    });

    const instanceProfile = new iam.InstanceProfile(this, "InstanceProfile", {
      role: instanceRole,
    });

    const managedInstancesSecurityGroup = new ec2.SecurityGroup(this, "ManagedInstancesSecurityGroup", { vpc });

    // ECS Managed Instances capacity provider. There is no L2 construct for
    // this resource yet, so it is defined directly at the L1 level.
    const capacityProvider = new ecs.CfnCapacityProvider(this, "CapacityProvider", {
      name: "managed-instances-example",
      clusterName: cluster.clusterName,
      managedInstancesProvider: {
        infrastructureRoleArn: infrastructureRole.roleArn,
        instanceLaunchTemplate: {
          ec2InstanceProfileArn: instanceProfile.instanceProfileArn,
          monitoring: "BASIC",
          networkConfiguration: {
            subnets: vpc.privateSubnets.map((subnet) => subnet.subnetId),
            securityGroups: [managedInstancesSecurityGroup.securityGroupId],
          },
          instanceRequirements: {
            vCpuCount: { min: 1, max: 4 },
            memoryMiB: { min: 2048, max: 8192 },
          },
        },
      },
    });

    // Configure the Datadog ECS Managed Instances construct
    const ecsDatadog = new DatadogECSManagedInstances({
      family: "datadog-agent-daemon",
      apiKey: process.env.DD_API_KEY_SECRET,
      clusterArn: cluster.clusterArn,
      capacityProviderArns: [ecs.CfnCapacityProvider.arnForCapacityProvider(capacityProvider)],
      taskCpu: "256",
      taskMemory: "512",
      environmentVariables: {
        DD_TAGS: "team:cont-p, owner:container-monitoring",
      },
      dogstatsd: {
        isEnabled: true,
      },
      apm: {
        isEnabled: true,
      },
      env: "staging",
      version: "v1.0.0",
      service: "container-service",
    });

    // Create the Datadog Agent daemon task definition and daemon
    const daemon = ecsDatadog.daemonTaskDefinition(this, "TypescriptDatadogDaemon");

    // The Datadog Agent daemon task definition holds only the Agent
    // container. Application containers run in their own, separate task
    // definition, wired to the daemon over the shared UDS socket volume.
    // MANAGED_INSTANCES only supports "host" or "awsvpc" network mode, not
    // "bridge".
    const appTaskDefinition = new ecs.TaskDefinition(this, "AppTaskDefinition", {
      // ECS Managed Instances tasks are placed via a capacity provider
      // strategy on EC2 instances, so they use EC2 compatibility - there is
      // no distinct "Managed Instances" launch type at the task definition
      // level.
      compatibility: ecs.Compatibility.EC2,
      networkMode: ecs.NetworkMode.HOST,
      family: "sample-app",
    });

    const appContainer = appTaskDefinition.addContainer("DogstatsdApp", {
      containerName: "datadog-dogstatsd-app",
      image: ecs.ContainerImage.fromRegistry("ghcr.io/datadog/apps-dogstatsd:main"),
      essential: true,
      memoryLimitMiB: 256,
      environment: {
        ...Object.fromEntries(daemon.dogstatsdEnvironment.map((pair) => [pair.name!, pair.value!])),
        ...Object.fromEntries(daemon.apmEnvironment.map((pair) => [pair.name!, pair.value!])),
      },
    });

    // The daemon's volume/mount point outputs use the CfnDaemonTaskDefinition
    // CloudFormation property shapes; rebuild them as plain L2 objects to
    // attach to the application task definition.
    if (daemon.appDdSocketsVolume && daemon.appDdSocketsMountPoint) {
      const socketsHost = daemon.appDdSocketsVolume.host as ecs.CfnDaemonTaskDefinition.HostVolumePropertiesProperty;
      appTaskDefinition.addVolume({
        name: daemon.appDdSocketsVolume.name!,
        host: { sourcePath: socketsHost?.sourcePath },
      });
      appContainer.addMountPoints({
        sourceVolume: daemon.appDdSocketsMountPoint.sourceVolume!,
        containerPath: daemon.appDdSocketsMountPoint.containerPath!,
        readOnly: true,
      });
    }
  }
}
