/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import { LambdaRestApi, LogGroupLogDestination } from "@aws-cdk/aws-apigateway";
import { LogGroup } from "@aws-cdk/aws-logs";
import { Datadog } from "../../src/index";
import { Architecture } from "@aws-cdk/aws-lambda";

export class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaFunction = new lambda.Function(this, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromInline("test"),
      handler: "lambdaFunction.handler",
      architecture: Architecture.ARM_64
    });

    const restLogGroup = new LogGroup(this, "restLogGroup");
    new LambdaRestApi(this, "rest-test", {
      handler: lambdaFunction,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(restLogGroup),
      },
    });

    const datadogCDK = new Datadog(this, "Datadog", {
      nodeLayerVersion: 62,
      extensionLayerVersion: 10,
      enableDatadogTracing: true,
      flushMetricsToLogs: true,
      sourceCodeIntegration: false,
      apiKey: "1234",
      site: "datadoghq.com",
    });
    datadogCDK.addLambdaFunctions([lambdaFunction]);
    datadogCDK.addForwarderToNonLambdaLogGroups([restLogGroup]);
  }
}

const app = new cdk.App();
const env = { account: "601427279990", region: "sa-east-1" };
const stack = new ExampleStack(app, "lambda-function-arm-stack", { env: env });
console.log("Stack name: " + stack.stackName);
app.synth();
