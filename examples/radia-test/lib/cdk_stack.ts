import { DatadogLambda } from "datadog-cdk-constructs-v2";
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';


export class RadiaCDKStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Lambda function definition
    const myLambda = new lambda.Function(this, 'RadiaCDKTest', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler.handler',
      code: lambda.Code.fromAsset('lambda'),
    });

    myLambda.addEnvironment("DD_CAPTURE_LAMBDA_PAYLOAD", "True");

    const datadogLambda = new DatadogLambda(this, "datadogLambda", {
      // captureLambdaPayload: true,
      nodeLayerVersion: 126,
      // pythonLayerVersion: <LAYER_VERSION>,
      // javaLayerVersion: <LAYER_VERSION>,
      // dotnetLayerVersion: <LAYER_VERSION>
      addLayers: true,
      extensionLayerVersion: 82,
      // forwarderArn: "<FORWARDER_ARN>",
      // createForwarderPermissions: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
      // apiKey: "{Datadog_API_Key}",
      apiKeySecretArn: "arn:aws:secretsmanager:us-west-2:425362996713:secret:radia_api_key-ME8dgU",
      // apiKeySecret: <AWS_CDK_ISECRET>, // Only available in datadog-cdk-constructs-v2
      // apiKmsKey: "{Encrypted_Datadog_API_Key}",
      enableDatadogTracing: true,
      enableMergeXrayTraces: true,
      enableDatadogLogs: true,
      injectLogContext: true,
      logLevel: "debug",
      env: "dev", //Optional
      service: "radia-cdktest", //Optional
      version: "1.0.0", //Optional
      // tags: <STRING>, //Optional
    });

    datadogLambda.addLambdaFunctions([myLambda])
    // myLambda.addEnvironment("DD_CAPTURE_LAMBDA_PAYLOAD", "True");
    // datadogLambda.addForwarderToNonLambdaLogGroups([<LOG_GROUPS>])
  }

}