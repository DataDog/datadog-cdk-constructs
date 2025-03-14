/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { App, Environment, Stack, StackProps } from "aws-cdk-lib";
import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { DatadogECSFargate } from "../../ecs/fargate/datadog-ecs-fargate";

export class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

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

    // Create a secret for the Datadog API key
    const secret = new secretsmanager.Secret(this, "DatadogApiKeySecret", {
      secretName: "DatadogSecret-CDK",
      description: "Datadog API key",
      secretStringValue: cdk.SecretValue.unsafePlainText(process.env.DD_API_KEY!),
    });

    // Configure the Datadog ECS Fargate construct
    const ecsDatadog = new DatadogECSFargate({
      apiKeySecret: secret,
      clusterName: cluster.clusterName,
      isDatadogDependencyEnabled: true,
      environmentVariables: {
        DD_TAGS: "team:cont-p, owner:container-monitoring",
      },
      dogstatsd: {
        isEnabled: true,
      },
      apm: {
        isEnabled: true,
      },
      cws: {
        isEnabled: false,
      },
      logCollection: {
        isEnabled: true,
        isLogRouterDependencyEnabled: true,
        logDriverConfiguration: {
          tls: "on",
          serviceName: "datadog-cdk-test",
          sourceName: "datadog-cdk-test",
        },
      },
      env: "staging",
      version: "v1.0.0",
      service: "container-service",
    });

    // Create a Datadog ECS Fargate task definition
    const fargateTaskDefinition = ecsDatadog.fargateTaskDefinition(this, "ExampleFargateTask", {
      taskRole: executionRole,
      memoryLimitMiB: 1024,
    });

    fargateTaskDefinition.addContainer("DatadogDogstatsd", {
      containerName: "datadog-dogstatsd-app",
      image: ecs.ContainerImage.fromRegistry("ghcr.io/datadog/apps-dogstatsd:main"),
      essential: false,
    });

    fargateTaskDefinition.addContainer("DatadogAPM", {
      containerName: "datadog-apm-app",
      image: ecs.ContainerImage.fromRegistry("ghcr.io/datadog/apps-tracegen:main"),
      essential: false,
    });

    fargateTaskDefinition.addContainer("DatadogCWS", {
      containerName: "datadog-cws-app",
      image: ecs.ContainerImage.fromRegistry("public.ecr.aws/ubuntu/ubuntu:22.04_stable"),
      essential: false,
      entryPoint: [
        "/usr/bin/bash",
        "-c",
        "cp /usr/bin/bash /tmp/malware; chmod u+s /tmp/malware; apt update;apt install -y curl wget; /tmp/malware -c 'while true; do wget https://google.com; sleep 60; done'",
      ],
    });

    new ecs.FargateService(this, "NginxService", {
      serviceName: "NginxService",
      cluster,
      taskDefinition: fargateTaskDefinition,
      desiredCount: 1,
      assignPublicIp: true,
      enableExecuteCommand: true,
      circuitBreaker: {
        rollback: false,
      },
      minHealthyPercent: 0,
    });
  }
}

const app = new App();
const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION,
};
const stack = new ExampleStack(app, "ExampleDatadogEcsStack", { env: env });
console.log("Stack name: " + stack.stackName);
app.synth();
