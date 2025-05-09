/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { App, Stack, StackProps } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { DatadogLambda } from "../../index";

export class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaNodejsFunction = new lambdaNodejs.NodejsFunction(this, "NodeJSHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: "./src/sample/lambda/nodejs/hello_node.js",
      handler: "handler",
    });

    const datadogLambda = new DatadogLambda(this, "Datadog", {
      nodeLayerVersion: 67,
      extensionLayerVersion: 16,
      enableDatadogTracing: true,
      flushMetricsToLogs: true,
      apiKey: process.env.API_KEY,
    });
    datadogLambda.addLambdaFunctions([lambdaNodejsFunction]);
  }
}

const app = new App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: "sa-east-1" };
const stack = new ExampleStack(app, "CDKV2TestingExampleDatadogStack", {
  env: env,
});
console.log("Stack name: " + stack.stackName);
app.synth();
