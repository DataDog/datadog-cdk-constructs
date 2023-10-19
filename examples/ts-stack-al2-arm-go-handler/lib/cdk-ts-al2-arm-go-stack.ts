import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { GoFunction } from "@aws-cdk/aws-lambda-go-alpha";

import { Datadog } from "datadog-cdk-constructs-v2";

import { Construct } from "constructs";

export class CdkTsAl2ArmGoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const datadogConstruct = new Datadog(this as any, "Datadog", {
      extensionLayerVersion: 49,
      addLayers: true,
      apiKey: process.env.DD_API_KEY,
      site: "datadoghq.com",
    });

    const goHandler = new GoFunction(this, "CdkTsAl2ArmGoHandler", {
      entry: "./main.go",
      functionName: "cdk-al2-arm-go-handler",
      architecture: lambda.Architecture.ARM_64,
      runtime: lambda.Runtime.PROVIDED_AL2,
      timeout: cdk.Duration.seconds(30),
      bundling: {
        goBuildFlags: ['-ldflags "-s -w"'],
      },
      environment: {
        LOG_LEVEL: "INFO",
        TABLE_NAME: "HelloWorld",
      },
    });

    datadogConstruct.addLambdaFunctions([goHandler]);
  }
}
