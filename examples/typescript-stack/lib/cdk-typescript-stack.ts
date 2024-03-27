import { GoFunction } from "@aws-cdk/aws-lambda-go-alpha";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import { BundlingOutput, Duration, Stack, StackProps } from "aws-cdk-lib";
import { Function } from "aws-cdk-lib/aws-lambda";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { Construct } from "constructs";
import { Datadog } from "datadog-cdk-constructs-v2";

export class CdkTypeScriptStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    console.log("Creating Hello World TypeScript stack");

    const helloNode = new Function(this, "hello-node", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: Duration.seconds(10),
      code: lambda.Code.fromAsset("../lambda/node", {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: [
            "bash",
            "-c",
            "cp -aT . /asset-output && npm install --prefix /asset-output",
          ],
          user: "root",
        },
      }),
      handler: "hello.lambda_handler",
    });

    const helloPython = new Function(this, "hello-python", {
      runtime: lambda.Runtime.PYTHON_3_12,
      timeout: Duration.seconds(10),
      memorySize: 256,
      code: lambda.Code.fromAsset("../lambda/python", {
        bundling: {
          image: lambda.Runtime.PYTHON_3_12.bundlingImage,
          command: [
            "bash",
            "-c",
            "pip install -r requirements.txt -t /asset-output && cp -aT . /asset-output",
          ],
        },
      }),
      handler: "hello.lambda_handler",
    });

    const helloGo = new GoFunction(this, "hello-go", {
      entry: "../lambda/go/hello.go",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.PROVIDED_AL2,
      timeout: Duration.seconds(10),
      bundling: {
        goBuildFlags: ['-ldflags "-s -w"'],
      },
      environment: {
        LOG_LEVEL: "INFO",
        TABLE_NAME: "HelloWorld",
      },
    });

    const helloDotnet = new Function(this, "hello-dotnet", {
      runtime: lambda.Runtime.DOTNET_8,
      handler: "HelloWorld::HelloWorld.Handler::SayHi",
      memorySize: 256,
      code: lambda.Code.fromAsset('../lambda/dotnet/', {
        bundling: {
          image: lambda.Runtime.DOTNET_8.bundlingImage,
          command: [
            '/bin/sh',
            '-c',
            ' dotnet tool install -g Amazon.Lambda.Tools' +
            ' && dotnet build' +
            ' && dotnet lambda package --output-package /asset-output/function.zip'
          ],
          user: 'root',
          outputType: BundlingOutput.ARCHIVED
        }
      })
    })

    const dotnetHttpIntegration = new HttpLambdaIntegration('GetDotnetIntegration', helloDotnet);
    const dotnetHttpApi = new apigwv2.HttpApi(this, "dotnetHttpApi")
    dotnetHttpApi.addRoutes({
      path: '/hello',
      methods: [ apigwv2.HttpMethod.GET ],
      integration:  dotnetHttpIntegration
    });

    console.log(
      "Instrumenting Lambda Functions in TypeScript stack with Datadog"
    );

    const DatadogCDK = new Datadog(this, "Datadog", {
      dotnetLayerVersion: 15,
      nodeLayerVersion: 108,
      pythonLayerVersion: 89,
      extensionLayerVersion: 55,
      addLayers: true,
      apiKey: process.env.DD_API_KEY,
      enableDatadogTracing: true,
      enableDatadogASM: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });

    DatadogCDK.addLambdaFunctions([helloNode, helloPython, helloGo, helloDotnet]);
  }
}
