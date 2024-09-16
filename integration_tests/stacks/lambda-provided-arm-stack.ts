import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from "aws-cdk-lib/aws-s3";
import { LambdaRestApi, LogGroupLogDestination } from "aws-cdk-lib/aws-apigateway";
import { LogGroup } from "aws-cdk-lib/aws-logs";
import { Stack, StackProps, App } from "aws-cdk-lib";
import { DatadogLambda } from "../../src/index";

export class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const s3Bucket = new s3.Bucket(this, "exampleBucket", {
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const providedLambda = new lambda.Function(this, "HelloHandler", {
      runtime: lambda.Runtime.PROVIDED_AL2,
      code: lambda.Code.fromBucket(s3Bucket, "fake-key-for-test"),
      handler: "handler.handler",
      architecture: lambda.Architecture.ARM_64,
    });

    s3Bucket.grantRead(providedLambda);

    const restLogGroup = new LogGroup(this, "restLogGroup");
    new LambdaRestApi(this, "rest-test", {
      handler: providedLambda,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(restLogGroup),
      },
    });

    const datadogLambda = new DatadogLambda(this, "Datadog", {
      extensionLayerVersion: 49,
      apiKey: "1234",
      site: "datadoghq.com",
      sourceCodeIntegration: false,
    });
    datadogLambda.addLambdaFunctions([providedLambda]);
    datadogLambda.addForwarderToNonLambdaLogGroups([restLogGroup]);
  }
}

const app = new App();
const env = { account: "601427279990", region: "sa-east-1" };
const stack = new ExampleStack(app, "lambda-provided-arm-stack", { env: env });
console.log("Stack name: " + stack.stackName);
app.synth();
