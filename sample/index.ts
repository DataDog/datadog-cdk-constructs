import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { Datadog } from "../lib/index";

export class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //user's lambda function
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
    });

    const DatadogCDK = new Datadog(this, "Datadog");
    DatadogCDK.addLambdaFunction({
      lambdaFunctions: [hello, hello1, hello2],
      nodeLayerVersion: 39,
      pythonLayerVersion: 24,
      addLayers: true,
      forwarderARN:
        "arn:aws:lambda:us-east-1:172597598159:function:datadog-forwarder-prod-org-11287",
    });
  }
}

const app = new cdk.App();
new ExampleStack(app, "ExampleStack");
app.synth();
