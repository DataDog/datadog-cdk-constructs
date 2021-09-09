/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { LambdaRestApi, LogGroupLogDestination } from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdaNodeJS from "@aws-cdk/aws-lambda-nodejs";
import { LogGroup } from "@aws-cdk/aws-logs";
import * as cdk from "@aws-cdk/core";
import { Datadog } from "../index";

export class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // user's lambda function
    const hello = new lambda.Function(this, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("./src/sample/lambda"),
      handler: "hello.handler"
    });

    const helloNodeJS = new lambdaNodeJS.NodejsFunction(this, "NodeJSHandler", {
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: "./src/sample/lambda_nodejs/hello_node.js",
      handler: "handler"
    });

    // set up rest api and log group
    const restLogGroup = new LogGroup(this, "restLogGroup");
    new LambdaRestApi(this, "rest-test", {
      handler: helloNodeJS,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(restLogGroup),
      },
    });

    const hello1 = new lambda.Function(this, "HelloHandler1", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("./src/sample/lambda"),
      handler: "hello.handler",
    });

    const restLogGroup1 = new LogGroup(this, "restLogGroup1");
    new LambdaRestApi(this, "rest-test1", {
      handler: hello1,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(restLogGroup1),
      },
    });

    const hello2 = new lambda.Function(this, "HelloHandler2", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("./src/sample/lambda"),
      handler: "hello_py.handler",
      tracing: lambda.Tracing.ACTIVE,
    });

    const restLogGroup2 = new LogGroup(this, "restLogGroup2");
    new LambdaRestApi(this, "rest-test2", {
      handler: hello2,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(restLogGroup2),
      },
    });

    const datadogCDK = new Datadog(this, "Datadog", {
      nodeLayerVersion: 62,
      extensionLayerVersion: 10,
      forwarderArn: "<forwarder_ARN>",
      enableDatadogTracing: true,
      flushMetricsToLogs: true,
      apiKey: "1234",
      site: "datadoghq.com",
    });
    datadogCDK.addLambdaFunctions([hello, helloNodeJS, hello1, hello2]);
    datadogCDK.addForwarderToNonLambdaLogGroups([restLogGroup, restLogGroup1, restLogGroup2]);
  }
}

const app = new cdk.App();
const env = { account: "<AWS_ACCOUNT>", region: "sa-east-1" };
const stack = new ExampleStack(app, "ExampleDatadogStack", { env: env });
console.log("Stack name: " + stack.stackName);
app.synth();
