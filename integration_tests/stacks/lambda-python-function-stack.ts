/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
import { PythonFunction } from "@aws-cdk/aws-lambda-python";
import * as cdk from "@aws-cdk/core";
import { Datadog } from "../../src/index";

export class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaPythonFunction = new PythonFunction(this, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      entry: __dirname + "/../../../lambda",
      index: "example-python.py",
      handler: "handler",
    });

    const datadogCDK = new Datadog(this, "Datadog", {
      nodeLayerVersion: 62,
      pythonLayerVersion: 46,
      extensionLayerVersion: 10,
      enableDatadogTracing: true,
      flushMetricsToLogs: true,
      apiKey: "1234",
      site: "datadoghq.com",
    });
    datadogCDK.addLambdaFunctions([lambdaPythonFunction]);
  }
}

const app = new cdk.App();
const env = { account: "601427279990", region: "sa-east-1" };
const stack = new ExampleStack(app, "lambda-python-function-stack", { env: env });
console.log("Stack name: " + stack.stackName);
app.synth();
