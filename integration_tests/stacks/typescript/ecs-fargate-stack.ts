/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { Stack, StackProps, App } from "aws-cdk-lib";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { DatadogECSFargate } from "../../../src/index";

export class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create Datadog ECS Fargate
    const ecsDatadog = new DatadogECSFargate({
      apiKey: 'exampleApiKey',
      env: 'prod',
      apm: {
        isEnabled: true,
        traceInferredProxyServices: true,
      },
    });

    // Create Task Definition
    const taskDefinition = ecsDatadog.fargateTaskDefinition(this, 'taskDefinition', {
      memoryLimitMiB: 512,
      cpu: 256,
    });

    // Add service container to task definition.
    taskDefinition.addContainer('ecsSample', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
    });
    taskDefinition.addContainer('nameServer', {
      image: ecs.ContainerImage.fromRegistry('ecs-sample-image/name-server'),
    });
    taskDefinition.addContainer('helloServer', {
      image: ecs.ContainerImage.fromRegistry('ecs-sample-image/hello-server'),
    });
  }
}

const app = new App();
const env = { account: "601427279990", region: "sa-east-1" };
const stack = new ExampleStack(app, "ecs-fargate-stack", { env: env });
console.log("Stack name: " + stack.stackName);
app.synth();
