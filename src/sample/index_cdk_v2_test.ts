/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdaNodejs from "@aws-cdk/aws-lambda-nodejs";
import * as cdk from "@aws-cdk/core";
import { Datadog } from "../index";

export class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaNodejsFunction = new lambdaNodejs.NodejsFunction(this, "NodeJSHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: "./src/sample/lambda_nodejs/hello_node.js",
      handler: "handler",
    });

    const datadogCDK = new Datadog(this, "Datadog", {
      nodeLayerVersion: 67,
      extensionLayerVersion: 16,
      enableDatadogTracing: true,
      flushMetricsToLogs: true,
      apiKey: "1234",
    });
    datadogCDK.addLambdaFunctions([lambdaNodejsFunction]);
  }
}

const app = new cdk.App();
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: "sa-east-1" };
const stack = new ExampleStack(app, "CDKV2TestingExampleDatadogStack", { env: env });
console.log("Stack name: " + stack.stackName);
app.synth();
