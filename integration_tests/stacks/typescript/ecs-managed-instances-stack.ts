/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import { Stack, StackProps, App } from "aws-cdk-lib";
import { DatadogECSManagedInstances } from "../../../src/index";

export class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create Datadog ECS Managed Instances
    const ecsDatadog = new DatadogECSManagedInstances({
      family: "datadog-agent-daemon",
      apiKey: "exampleApiKey",
      env: "prod",
      clusterArn: "arn:aws:ecs:sa-east-1:601427279990:cluster/example-cluster",
      capacityProviderArns: ["arn:aws:ecs:sa-east-1:601427279990:capacity-provider/example-capacity-provider"],
      apm: {
        isEnabled: true,
      },
      dogstatsd: {
        isEnabled: true,
      },
    });

    // Daemon task definition with the default socket-based dogstatsd/APM configuration
    ecsDatadog.daemonTaskDefinition(this, "sampleDaemonTaskDefinition");

    // Daemon task definition overriding the base props to use TCP instead of UDS
    ecsDatadog.daemonTaskDefinition(this, "tcpDaemonTaskDefinition", {
      family: "datadog-agent-daemon",
      dogstatsd: { isEnabled: true, isSocketEnabled: false },
      apm: { isEnabled: true, isSocketEnabled: false },
    });

    // Daemon task definition without creating the AWS::ECS::Daemon resource
    ecsDatadog.daemonTaskDefinition(this, "taskDefinitionOnly", {
      family: "datadog-agent-daemon",
      createDaemon: false,
      clusterArn: undefined,
      capacityProviderArns: undefined,
    });
  }
}

const app = new App();
const env = { account: "601427279990", region: "sa-east-1" };
const stack = new ExampleStack(app, "ecs-managed-instances-stack", { env: env });
console.log("Stack name: " + stack.stackName);
app.synth();
