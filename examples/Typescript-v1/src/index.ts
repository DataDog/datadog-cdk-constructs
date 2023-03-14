/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { Datadog } from "datadog-cdk-constructs";

export class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const hello = new lambda.Function(this, "hello", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "hello.handler",
    });

    const hello1 = new lambda.Function(this, "hello1", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("lambda"),
      handler: "hello_py.lambda_handler",
    });

    const datadogForwarderArn = new cdk.CfnParameter(
      this,
      "datadogForwarderArn",
      {
        type: "String",
        description:
          "The Arn of the Datadog AWS Lambda forwarder function which will send data to Datadog.",
      }
    );

    const DatadogCDK = new Datadog(this, "Datadog", {
      nodeLayerVersion: 85,
      pythonLayerVersion: 65,

      addLayers: true,
      forwarderArn: datadogForwarderArn.valueAsString,
      enableDatadogTracing: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    DatadogCDK.addLambdaFunctions([hello, hello1]);
  }
}

const app = new cdk.App();
new ExampleStack(app, "CDK-Demo-Typescript");
app.synth();
