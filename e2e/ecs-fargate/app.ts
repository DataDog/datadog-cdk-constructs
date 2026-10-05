/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

import { Annotations, App, Stack, StackProps, Tags } from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import {
  APP_CONTAINER_NAME,
  APP_CONTAINER_PORT,
  ENV_NAME,
  ENV_VERSION,
  type ResolvedNetwork,
  SERVICE_SSI_CASE,
  SITE,
  SSI_CASES,
  type SsiCase,
  appImage,
  languageFamily,
  requireApiKey,
  requireEcsResources,
  requireEnv,
} from "./config";
import { type DatadogECSFargateProps, DatadogECSFargateTaskDefinition } from "../../src/index";
import { FRESHNESS_TAG_KEY, RUN_ID_TAG_KEY } from "../helpers/naming";

// The construct is the instrumentation mechanism under test. The stack is first deployed with plain
// Fargate task definitions (E2E_INSTRUMENT=false), then again with the construct in their place under
// the same construct IDs, so every family moves from an uninstrumented revision to an instrumented
// one. REMOVE is `cdk destroy` of the stack.
const instrument = process.env.E2E_INSTRUMENT === "true";
const serviceName = requireEnv("E2E_SERVICE_NAME");
const runId = requireEnv("E2E_RUN_ID");
const createdTs = requireEnv("E2E_CREATED_TS");
const network = JSON.parse(requireEnv("E2E_NETWORK")) as ResolvedNetwork;
const resources = requireEcsResources();
const apiKey = requireApiKey();
const runIdTag = `${RUN_ID_TAG_KEY}:${runId}`;

const TRACER_LOGS_WARNING_ID = "datadog-cdk-constructs-v2:apmInstrumentationTracerLogsNotCollected";

class EcsFargateWorkloadStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromVpcAttributes(this, "Vpc", {
      vpcId: network.vpcId,
      availabilityZones: [...new Set(network.subnets.map(({ availabilityZone }) => availabilityZone))],
    });

    new ecs.FargateService(this, "Service", {
      serviceName,
      cluster: ecs.Cluster.fromClusterAttributes(this, "Cluster", { clusterName: resources.cluster, vpc }),
      taskDefinition: this.serviceTaskDefinition(),
      desiredCount: 1,
      // The suite sends traffic to the task's public address.
      assignPublicIp: true,
      vpcSubnets: {
        subnets: network.subnets.map((subnet, index) =>
          ec2.Subnet.fromSubnetAttributes(this, `Subnet${index}`, subnet),
        ),
      },
      securityGroups: [
        ec2.SecurityGroup.fromSecurityGroupId(this, "SecurityGroup", resources.securityGroup, { mutable: false }),
      ],
      // A task that cannot start fails the deployment instead of retrying until CloudFormation times out.
      circuitBreaker: { rollback: false },
      minHealthyPercent: 0,
    });

    for (const ssiCase of SSI_CASES) {
      this.languageTaskDefinition(ssiCase);
    }

    // Stamp cleanup and run identity at creation so leaked resources remain attributable even if the
    // run stops before teardown.
    Tags.of(this).add(FRESHNESS_TAG_KEY, createdTs);
    Tags.of(this).add(RUN_ID_TAG_KEY, runId);
  }

  private serviceTaskDefinition(): ecs.FargateTaskDefinition {
    const taskDefinition = this.newTaskDefinition(
      "ServiceTaskDefinition",
      { family: serviceName, cpu: 512, memoryLimitMiB: 1024 },
      {
        ...this.datadogProps(serviceName),
        // FireLens stamps these on the application's logs, which the telemetry check queries.
        globalTags: `env:${ENV_NAME},version:${ENV_VERSION},${runIdTag}`,
        logCollection: {
          isEnabled: true,
          fluentbitConfig: {
            logDriverConfig: { hostEndpoint: `http-intake.logs.${SITE}`, serviceName, sourceName: "nodejs", tls: "on" },
          },
        },
        apmInstrumentation: { language: SERVICE_SSI_CASE.language },
      },
    );
    const baselineLogging = ecs.LogDrivers.awsLogs({
      logGroup: logs.LogGroup.fromLogGroupName(this, "LogGroup", resources.logGroup),
      streamPrefix: serviceName,
    });
    taskDefinition.addContainer(APP_CONTAINER_NAME, {
      containerName: APP_CONTAINER_NAME,
      image: ecs.ContainerImage.fromRegistry(appImage(resources.appImageRegistry, SERVICE_SSI_CASE.fixtureImageName)),
      portMappings: [{ containerPort: APP_CONTAINER_PORT }],
      // Stamps the run on the spans the injected tracer sends. The construct adds its own tag to it.
      environment: { DD_TAGS: runIdTag },
      // The construct routes the application's logs through FireLens; the baseline has no log router.
      logging: instrument ? undefined : baselineLogging,
    });
    return taskDefinition;
  }

  private languageTaskDefinition(ssiCase: SsiCase): void {
    const family = languageFamily(serviceName, ssiCase.language);
    const taskDefinition = this.newTaskDefinition(
      `${ssiCase.language}TaskDefinition`,
      { family, cpu: 256, memoryLimitMiB: 512 },
      { ...this.datadogProps(family), apmInstrumentation: { language: ssiCase.language } },
    );
    taskDefinition.addContainer(APP_CONTAINER_NAME, {
      containerName: APP_CONTAINER_NAME,
      image: ecs.ContainerImage.fromRegistry(appImage(resources.appImageRegistry, ssiCase.fixtureImageName)),
      portMappings: [{ containerPort: APP_CONTAINER_PORT }],
    });
    Annotations.of(taskDefinition).acknowledgeWarning(
      TRACER_LOGS_WARNING_ID,
      "This task definition is registered but never run, so the tracer container has no logs to collect.",
    );
  }

  private newTaskDefinition(
    id: string,
    props: ecs.FargateTaskDefinitionProps,
    datadogProps: DatadogECSFargateProps,
  ): ecs.FargateTaskDefinition {
    const taskDefinition = instrument
      ? new DatadogECSFargateTaskDefinition(this, id, props, datadogProps)
      : new ecs.FargateTaskDefinition(this, id, props);
    // Pulls the fixture image from its private ECR registry. ECS requires this role to register a
    // Fargate task definition with an ECR image, even one that never runs.
    taskDefinition
      .obtainExecutionRole()
      .addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonECSTaskExecutionRolePolicy"));
    return taskDefinition;
  }

  private datadogProps(service: string): DatadogECSFargateProps {
    return {
      apiKey,
      site: SITE,
      service,
      env: ENV_NAME,
      version: ENV_VERSION,
    };
  }
}

const app = new App();
new EcsFargateWorkloadStack(app, serviceName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION,
  },
});
app.synth();
