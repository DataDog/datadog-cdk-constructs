import { Stack, StackProps } from "aws-cdk-lib";
import { ContainerImage } from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
import { DatadogECSFargate } from "datadog-cdk-constructs-v2";

export class CdkTypeScriptStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    console.log("Instrumenting ECS Task Definitions in TypeScript stack with Datadog");

    // Configure the Datadog ECS Fargate construct
    const ecsDatadog = new DatadogECSFargate({
      apiKey: process.env.DD_API_KEY_SECRET,
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
      logCollection: {
        isEnabled: true,
        logDriverConfiguration: {
          serviceName: "datadog-cdk-test",
          sourceName: "datadog-cdk-test",
        },
      },
      env: "staging",
      version: "v1.0.0",
      service: "container-service",
    });

    // Create a Datadog ECS Fargate task definition
    const fargateTaskDefinition = ecsDatadog.fargateTaskDefinition(this, "TypescriptFargateTask", {
      memoryLimitMiB: 1024,
    });

    fargateTaskDefinition.addContainer("DogstatsdApp", {
      containerName: "datadog-dogstatsd-app",
      image: ContainerImage.fromRegistry("ghcr.io/datadog/apps-dogstatsd:main"),
      essential: false,
    });

    fargateTaskDefinition.addContainer("DatadogAPM", {
      containerName: "datadog-apm-app",
      image: ContainerImage.fromRegistry("ghcr.io/datadog/apps-tracegen:main"),
      essential: true,
    });
  }
}
