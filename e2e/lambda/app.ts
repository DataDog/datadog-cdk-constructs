/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

import * as path from "path";
import { App, RemovalPolicy, Stack, StackProps, Tags } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import { ENV_NAME, ENV_VERSION, RUNTIME, SITE, requireEnv } from "./config";
import { DatadogDefaultLayerVersions, DatadogLambda } from "../../src/index";
import { FRESHNESS_TAG_KEY, RUN_ID_TAG_KEY } from "../helpers/naming";

// The construct is the instrumentation mechanism under test. The stack is first deployed without it
// (E2E_INSTRUMENT=false), then again with DatadogLambda applied to the same function. REMOVE is
// `cdk destroy` of the stack.
const instrument = process.env.E2E_INSTRUMENT === "true";
const serviceName = requireEnv("E2E_SERVICE_NAME");
const runId = requireEnv("E2E_RUN_ID");
const createdTs = requireEnv("E2E_CREATED_TS");

class LambdaWorkloadStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const logGroup = new logs.LogGroup(this, "HandlerLogGroup", {
      logGroupName: `/aws/lambda/${serviceName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      retention: logs.RetentionDays.ONE_DAY,
    });
    const fn = new lambda.Function(this, "Handler", {
      functionName: serviceName,
      runtime: RUNTIME,
      handler: "index.handler",
      logGroup,
      // Resolved from the repository root, where cdk runs, because the bundled app's __dirname is the
      // build output directory.
      code: lambda.Code.fromAsset(path.resolve(process.cwd(), "e2e/lambda/handler")),
    });

    // Stamp cleanup and run identity at creation so leaked resources remain attributable even if the
    // run stops before teardown.
    Tags.of(this).add(FRESHNESS_TAG_KEY, createdTs);
    Tags.of(this).add(RUN_ID_TAG_KEY, runId);

    if (!instrument) {
      return;
    }

    // The Node layer uses the construct's default version. The extension has no default, so the suite
    // passes the default the construct ships.
    const datadogLambda = new DatadogLambda(this, "Datadog", {
      extensionLayerVersion: DatadogDefaultLayerVersions.EXTENSION,
      // The construct grants the function read access to the secret.
      apiKeySecret: secretsmanager.Secret.fromSecretCompleteArn(
        this,
        "ApiKeySecret",
        requireEnv("AWS_LAMBDA_API_KEY_SECRET_ARN"),
      ),
      // Source code integration would add git tags to DD_TAGS.
      sourceCodeIntegration: false,
      site: SITE,
      service: serviceName,
      env: ENV_NAME,
      version: ENV_VERSION,
      // Stamps the run on the function's spans and logs.
      tags: `${RUN_ID_TAG_KEY}:${runId}`,
    });
    datadogLambda.addLambdaFunctions([fn]);
  }
}

const app = new App();
new LambdaWorkloadStack(app, serviceName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? process.env.AWS_REGION,
  },
});
app.synth();
