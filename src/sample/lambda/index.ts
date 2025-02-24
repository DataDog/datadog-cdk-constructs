/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

// eslint-disable-next-line import/no-extraneous-dependencies
import * as lambdaPython from "@aws-cdk/aws-lambda-python-alpha";
import { App, Environment, Stack, StackProps } from "aws-cdk-lib";
import { LambdaRestApi, LogGroupLogDestination } from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { DatadogLambda } from "../../index";

export class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const lambdaFunction = new lambda.Function(this, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("./src/sample/lambda/python"),
      handler: "lambdaFunction.handler",
    });

    const lambdaNodejsFunction = new lambdaNodejs.NodejsFunction(this, "NodeJSHandler", {
      runtime: lambda.Runtime.NODEJS_20_X,
      entry: "./src/sample/lambda/nodejs/hello_node.js",
      handler: "handler",
    });

    const lambdaPythonFunction = new lambdaPython.PythonFunction(this, "PythonHandler", {
      runtime: lambda.Runtime.PYTHON_3_12,
      entry: "./src/sample/lambda/python/",
      index: "hello_py.py",
      handler: "handler",
    });

    // set up rest api and log group
    const restLogGroup = new LogGroup(this, "restLogGroup");
    new LambdaRestApi(this, "rest-test", {
      handler: lambdaNodejsFunction,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(restLogGroup),
      },
    });

    const lambdaFunction1 = new lambda.Function(this, "HelloHandler1", {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset("./src/sample/lambda/python"),
      handler: "lambdaFunction.handler",
    });

    const restLogGroup1 = new LogGroup(this, "restLogGroup1");
    new LambdaRestApi(this, "rest-test1", {
      handler: lambdaFunction1,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(restLogGroup1),
      },
    });

    const lambdaFunction2 = new lambda.Function(this, "HelloHandler2", {
      runtime: lambda.Runtime.PYTHON_3_12,
      code: lambda.Code.fromAsset("./src/sample/lambda/python"),
      handler: "hello_py.handler",
      tracing: lambda.Tracing.ACTIVE,
    });

    const restLogGroup2 = new LogGroup(this, "restLogGroup2");
    new LambdaRestApi(this, "rest-test2", {
      handler: lambdaPythonFunction,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(restLogGroup2),
      },
    });

    const datadogLambda = new DatadogLambda(this, "Datadog", {
      nodeLayerVersion: 62,
      pythonLayerVersion: 46,
      extensionLayerVersion: 10,
      // forwarderArn: "<forwarder_ARN>",
      // createForwarderPermissions: false,
      enableDatadogTracing: true,
      flushMetricsToLogs: true,
      apiKey: process.env.API_KEY,
      site: "datadoghq.com",
    });
    datadogLambda.addLambdaFunctions([
      lambdaFunction,
      lambdaNodejsFunction,
      lambdaPythonFunction,
      lambdaFunction1,
      lambdaFunction2,
    ]);
    datadogLambda.addForwarderToNonLambdaLogGroups([restLogGroup, restLogGroup1, restLogGroup2]);
  }
}

const app = new App();
const env: Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT_ID,
  region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION,
};
const stack = new ExampleStack(app, "ExampleDatadogStack", { env: env });
console.log("Stack name: " + stack.stackName);
app.synth();
