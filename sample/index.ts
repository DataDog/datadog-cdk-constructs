import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import { DatadogCDKStack } from '../lib';

export class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

   //user's lambda function
    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'hello.handler',
    });

    const hello1 = new lambda.Function(this, 'HelloHandler1', {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'hello.handler',
    });

    const hello2 = new lambda.Function(this, 'HelloHandler2', {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset('lambda'),
      handler: 'hello_py.handler',
    });

    const datadogCDK = new DatadogCDKStack(this, 'DatadogCDK', {
      downstreams: [hello, hello1, hello2],
      nodeLayerVersion: 39,
      pythonLayerVersion: 24,
      addLayers: true
    });
  }
}

const app = new cdk.App();
new ExampleStack(app, 'ExampleStack');
app.synth();
