/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { Datadog } from "../lib/index";

export class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // user's lambda function
    const hello = new lambda.Function(this, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "hello.handler",
    });

    const hello1 = new lambda.Function(this, "HelloHandler1", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "hello.handler",
    });

    const hello2 = new lambda.Function(this, "HelloHandler2", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("lambda"),
      handler: "hello_py.handler",
      tracing: lambda.Tracing.ACTIVE,
    });

    const datadogCDK = new Datadog(this, "Datadog", {
      nodeLayerVersion: 39,
      pythonLayerVersion: 24,
      forwarderARN:"<forwarder_ARN",
      enableDDTracing: true,
      flushMetricsToLogs: true,
      apiKey: "1234",
      site: "us3.datadoghq.com",
    });
    datadogCDK.addLambdaFunctions([hello, hello1, hello2]);
  }
}

const app = new cdk.App();
const stack = new ExampleStack(app, "ExampleStack");
console.log("Stack name: "+stack.stackName);
app.synth();
