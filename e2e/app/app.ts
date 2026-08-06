/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as path from "path";
import { App, RemovalPolicy, Stack, StackProps, Tags } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { DatadogLambda } from "../../src/index";
import { FRESHNESS_TAG_KEY, RUN_ID_TAG_KEY } from "../helpers/naming";
import { E2E_NODE_LAYER_VERSION, E2E_EXTENSION_LAYER_VERSION, E2E_RUNTIME } from "./versions";

// The CDK construct is the instrumentation mechanism under test. This same stack
// is provisioned uninstrumented first (E2E_INSTRUMENT=false, no DatadogLambda),
// then APPLY re-deploys it with E2E_INSTRUMENT=true (DatadogLambda applied). REMOVE
// is `cdk destroy` of the stack -- the function is deleted, leaving a clean
// end-state -- so the uninstrumented path only serves the initial baseline.
const instrument = process.env.E2E_INSTRUMENT === "true";
const serviceName = requireEnv("E2E_SERVICE_NAME");
const runId = requireEnv("E2E_RUN_ID");
const createdTs = requireEnv("E2E_CREATED_TS");
const site = process.env.DD_SITE ?? "datadoghq.com";
const env = process.env.E2E_ENV ?? "e2e";
const version = process.env.E2E_VERSION ?? "1.0.0";

class WorkloadStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const logGroup = new logs.LogGroup(this, "HandlerLogGroup", {
      logGroupName: `/aws/lambda/${serviceName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_DAY,
    });
    const fn = new lambda.Function(this, "Handler", {
      functionName: serviceName,
      runtime: E2E_RUNTIME,
      handler: "index.handler",
      logGroup,
      // Resolved from cwd (the repo root, where cdk runs) so it survives bundling
      // the app to a single .cjs whose __dirname is the build output dir.
      code: lambda.Code.fromAsset(path.resolve(process.cwd(), "e2e/app/handler")),
    });

    // Stamp cleanup and run identity at creation so leaked resources remain attributable
    // even if the run stops before instrumentation or teardown.
    for (const resource of [fn, logGroup]) {
      Tags.of(resource).add(FRESHNESS_TAG_KEY, createdTs);
      Tags.of(resource).add(RUN_ID_TAG_KEY, runId);
    }

    if (!instrument) {
      return;
    }

    const datadogLambda = new DatadogLambda(this, "Datadog", {
      nodeLayerVersion: E2E_NODE_LAYER_VERSION,
      extensionLayerVersion: E2E_EXTENSION_LAYER_VERSION,
      enableDatadogTracing: true,
      enableDatadogLogs: true,
      injectLogContext: true,
      sourceCodeIntegration: false,
      // Only needed when instrumenting; the uninstrumented baseline carries no key.
      apiKey: requireEnv("DD_API_KEY"),
      site,
      service: serviceName,
      env,
      version,
      // Stamp the run id on emitted spans and logs so the telemetry checker can
      // distinguish this run from concurrent suites.
      tags: `${RUN_ID_TAG_KEY}:${runId}`,
    });
    datadogLambda.addLambdaFunctions([fn]);
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var ${name}`);
  }

  return value;
}

const app = new App();
new WorkloadStack(app, serviceName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION,
  },
});
app.synth();
