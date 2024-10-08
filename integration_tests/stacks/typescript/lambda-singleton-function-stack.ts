/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "aws-cdk-lib/aws-lambda";
import { Stack, StackProps, App } from "aws-cdk-lib";
import { LambdaRestApi, LogGroupLogDestination } from "aws-cdk-lib/aws-apigateway";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { DatadogLambda } from "../../../src/index";

export class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const singletonLambdaFunction = new lambda.SingletonFunction(this, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromInline("test"),
      handler: "lambdaFunction.handler",
      uuid: "b55587fe-6985-4c28-ab51-4d0edb1ba8a1",
    });

    const restLogGroup = new LogGroup(this, "restLogGroup");
    new LambdaRestApi(this, "rest-test", {
      handler: singletonLambdaFunction,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(restLogGroup),
      },
    });

    const datadogLambda = new DatadogLambda(this, "Datadog", {
      nodeLayerVersion: 62,
      extensionLayerVersion: 10,
      enableDatadogTracing: true,
      flushMetricsToLogs: true,
      sourceCodeIntegration: false,
      apiKey: "1234",
      site: "datadoghq.com",
    });
    datadogLambda.addLambdaFunctions([singletonLambdaFunction]);
    datadogLambda.addForwarderToNonLambdaLogGroups([restLogGroup]);
  }
}

const app = new App();
const env = { account: "601427279990", region: "sa-east-1" };
const stack = new ExampleStack(app, "lambda-singleton-function-stack", { env: env });
console.log("Stack name: " + stack.stackName);
app.synth();
