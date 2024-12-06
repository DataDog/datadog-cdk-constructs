import * as lambda from "aws-cdk-lib/aws-lambda";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Function } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export abstract class CdkTypeScriptStackBase extends Stack {
  protected lambdaFunctions: lambda.Function[];
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    console.log("Creating Hello World TypeScript stack");

    const helloNode = new Function(this, "hello-node", {
      runtime: lambda.determineLatestNodeRuntime(this),
      memorySize: 256,
      timeout: Duration.seconds(10),
      code: lambda.Code.fromAsset("../lambda/node", {
        bundling: {
          image: lambda.Runtime.NODEJS_20_X.bundlingImage,
          command: ["bash", "-c", "cp -aT . /asset-output && npm install --prefix /asset-output"],
          user: "root",
        },
      }),
      handler: "hello.lambda_handler",
    });

    this.lambdaFunctions = [helloNode];
  }
}
