import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
// import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Construct } from "constructs";

export class EcsStackBase extends cdk.Stack {
  public fargateTaskDefinitions: ecs.TaskDefinition[];
  public apiKeySecret: secretsmanager.Secret;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a secret for the Datadog API key
    const secret = new secretsmanager.Secret(this, "DatadogSecret-Source", {
      secretName: "DatadogSecret-CDK",
      description: "Datadog API key",
      secretStringValue: cdk.SecretValue.unsafePlainText(process.env.DD_API_KEY!),
    });
    this.apiKeySecret = secret;

    // Create a VPC with default configuration
    const vpc = new ec2.Vpc(this, "EcsFargateVpc", {
      maxAzs: 2,
    });

    // Create an ECS cluster
    const cluster = new ecs.Cluster(this, "EcsFargateCDK", {
      clusterName: "EcsFargateCDK",
      vpc,
    });

    // Create an ECS task execution role
    const executionRole = new iam.Role(this, "TaskExecutionRole", {
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy")],
    });

    // Create an ECS Fargate task definition
    const fargateTaskDefinition = new ecs.FargateTaskDefinition(this, "ExampleFargateTask", {
      memoryLimitMiB: 2048,
      cpu: 256,
      executionRole: executionRole,
      runtimePlatform: {
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // Add a dummy container to the task definition
    fargateTaskDefinition.addContainer("NginxContainer", {
      image: ecs.ContainerImage.fromRegistry("nginx:latest"),
      essential: false,
      entryPoint: ["/docker-entrypoint.sh"],
    });

    fargateTaskDefinition.addContainer("DogStatsD", {
      image: ecs.ContainerImage.fromRegistry("ghcr.io/datadog/apps-dogstatsd:main"),
      essential: false,
    });

    fargateTaskDefinition.addContainer("DatadogAPM", {
      image: ecs.ContainerImage.fromRegistry("ghcr.io/datadog/apps-tracegen:main"),
      essential: false,
    });

    const fargateWindowsTaskDefinition = new ecs.FargateTaskDefinition(this, "WindowsTaskDef", {
      memoryLimitMiB: 4096,
      cpu: 2048,
      executionRole: executionRole,
      runtimePlatform: {
        operatingSystemFamily: ecs.OperatingSystemFamily.WINDOWS_SERVER_2022_CORE,
      },
    });

    fargateWindowsTaskDefinition.addContainer("WindowsContainer", {
      image: ecs.ContainerImage.fromRegistry("mcr.microsoft.com/dotnet/samples:aspnetapp-nanoserver-ltsc2022"),
    });

    // Create an ECS Fargate service (only Linux bc faster)
    new ecs.FargateService(this, "NginxService", {
      serviceName: "NginxService",
      cluster,
      taskDefinition: fargateTaskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
      enableExecuteCommand: true, // only for debugging: to enable ecs exec
    });

    this.fargateTaskDefinitions = [fargateTaskDefinition, fargateWindowsTaskDefinition];
  }
}
