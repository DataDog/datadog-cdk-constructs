import { GoFunction } from "@aws-cdk/aws-lambda-go-alpha";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Function } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import { Datadog } from "datadog-cdk-constructs-v2";

export class CdkTypeScriptStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    console.log("Creating Hello World TypeScript stack");

    const helloNode = new Function(this, "hello-node", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("../lambda/javascript"),
      handler: "hello.lambda_handler",
    });

    const helloPython = new Function(this, "hello-python", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("../lambda/python"),
      handler: "hello.lambda_handler",
    });

    const helloGo = new GoFunction(this, "hello-go", {
      entry: "../lambda/go/hello.go",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.PROVIDED_AL2,
      timeout: Duration.seconds(30),
      bundling: {
        goBuildFlags: ['-ldflags "-s -w"'],
      },
      environment: {
        LOG_LEVEL: "INFO",
        TABLE_NAME: "HelloWorld",
      },
    });

    console.log(
      "Instrumenting Lambda Functions in TypeScript stack with Datadog"
    );

    const DatadogCDK = new Datadog(this, "Datadog", {
      nodeLayerVersion: 99,
      pythonLayerVersion: 81,
      extensionLayerVersion: 49,
      addLayers: true,
      apiKey: process.env.DD_API_KEY,
      enableDatadogTracing: true,
      enableDatadogASM: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });

    DatadogCDK.addLambdaFunctions([helloNode, helloPython, helloGo]);
  }
}
