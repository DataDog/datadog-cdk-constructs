import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Function } from "aws-cdk-lib/aws-lambda";
import * as aws_apigateway from "aws-cdk-lib/aws-apigateway";

import { Datadog } from "datadog-cdk-constructs-v2";
import { Stack, StackProps } from "aws-cdk-lib";

/**
 * Create a Python + Node Hello World stack and instrument with Datadog
 *
 * Gets the Datadog API key from the DD_API_KEY env variable
 */
export class TypescriptV2Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    console.log("Creating Hello World stack");

    const helloNode = new Function(this, "cdk-v2-hello-node", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("lambda"),
      handler: "hello.handler",
    });

    const helloPython = new Function(this, "cdk-v2-hello-python", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("lambda"),
      handler: "hello_py.lambda_handler",
    });

    const apig = new aws_apigateway.RestApi(this, "RestAPI").root;
    apig.addResource('node').addProxy({
      anyMethod: true,
      defaultIntegration: new aws_apigateway.LambdaIntegration(helloNode),
    });
    apig.addResource('python').addProxy({
      anyMethod: true,
      defaultIntegration: new aws_apigateway.LambdaIntegration(helloPython),
    });

    console.log("Instrumenting with Datadog");

    const DatadogCDK = new Datadog(this as any, "Datadog", {
      nodeLayerVersion: 98,
      pythonLayerVersion: 80,
      extensionLayerVersion: 49,
      addLayers: true,
      apiKey: process.env.DD_API_KEY,
      enableDatadogTracing: true,
      enableDatadogASM: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });

    DatadogCDK.addLambdaFunctions([helloNode, helloPython]);
  }
}
