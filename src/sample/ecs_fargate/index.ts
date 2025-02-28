/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { App, Environment, StackProps } from "aws-cdk-lib";
import { EcsStackBase } from "./ecs_fargate";
import { DatadogEcsFargate, DatadogECSFargateProps } from "../../index";

export class ExampleStack extends EcsStackBase {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // Define your task definitions to be monitored by Datadog
    const fargateTaskDefinitions = this.fargateTaskDefinitions;

    // Configure your Datadog Agent
    const datadogProps: DatadogECSFargateProps = {
      apiKeySecret: this.apiKeySecret,
      environmentVariables: {
        DD_TAGS: "owner:gabedos, team:cont-p",
      },
      logDriverConfiguration: {
        serviceName: "gabe-service",
        sourceName: "gabe-source",
      },
      enableDogstatsd: true,
      // isLogRouterHealthCheckEnabled: false,
      enableAPM: true,
      enableCWS: true,
      enableLogCollection: true,
      env: "dev",
      service: "gabe-service",
      version: "1.0",
    };

    // Create the Datadog Agent configuration and apply to each task definition
    const datadog = new DatadogEcsFargate(this, "Datadog", datadogProps);

    datadog.editFargateTasks(fargateTaskDefinitions);
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
