/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as path from "path";
import { App, Stack, StackProps, Tags } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { DatadogLambda } from "../../src/index";
import { E2E_NODE_LAYER_VERSION, E2E_EXTENSION_LAYER_VERSION, E2E_RUNTIME } from "../helpers/versions";
import { FRESHNESS_TAG_KEY, RUN_ID_TAG_KEY } from "../helpers/naming";

// The CDK construct is the instrumentation mechanism under test, so APPLY and
// REMOVE are both `cdk deploy` of *this same stack*: APPLY deploys with
// E2E_INSTRUMENT=true (DatadogLambda applied), REMOVE re-deploys with
// E2E_INSTRUMENT=false (construct not applied) so CloudFormation strips the
// layers/env/tags in place. Teardown is `cdk destroy`.
const instrument = process.env.E2E_INSTRUMENT === "true";
const serviceName = requireEnv("E2E_SERVICE_NAME");
const runId = requireEnv("E2E_RUN_ID");
const createdTs = requireEnv("E2E_CREATED_TS");
const apiKey = requireEnv("DD_API_KEY");
const site = process.env.DD_SITE ?? "datadoghq.com";
const env = process.env.E2E_ENV ?? "e2e";
const version = process.env.E2E_VERSION ?? "1.0.0";

class WorkloadStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const fn = new lambda.Function(this, "Handler", {
      functionName: serviceName,
      runtime: E2E_RUNTIME,
      handler: "index.handler",
      // Resolved from cwd (the repo root, where cdk runs) so it survives bundling
      // the app to a single .cjs whose __dirname is the build output dir.
      code: lambda.Code.fromAsset(path.resolve(process.cwd(), "e2e/app/handler")),
    });

    // Freshness + identity tags are set at creation on the uninstrumented baseline
    // too, so the sweeper can always find and reap this function regardless of
    // instrumentation state. These are hygiene tags, not Datadog instrumentation
    // tags, so they intentionally survive REMOVE.
    Tags.of(fn).add(FRESHNESS_TAG_KEY, createdTs);

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
      apiKey,
      site,
      service: serviceName,
      env,
      version,
      // Surfaces as a `one_e2e_run_id` resource tag *and* in DD_TAGS, so the run id
      // rides along on every emitted span and log -- the dimension the telemetry
      // checker filters on to prove identity.
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
