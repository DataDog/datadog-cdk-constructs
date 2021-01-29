/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from '@aws-cdk/aws-lambda';
import * as cdk from '@aws-cdk/core';
import { Datadog } from './index';

export class Example2Stack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //user's lambda function
    const hello = new lambda.Function(this, 'HelloHandler', {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset('./sample/lambda'),
      handler: 'hello.handler',
    });

    const hello1 = new lambda.Function(this, 'HelloHandler1', {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset('./sample/lambda'),
      handler: 'hello.handler',
    });

    const hello2 = new lambda.Function(this, 'HelloHandler2', {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset('./sample/lambda'),
      handler: 'hello_py.handler',
      tracing: lambda.Tracing.ACTIVE,
    });

    const DatadogCDK = new Datadog(this, 'Datadog', {
      nodeLayerVersion: 39,
      pythonLayerVersion: 24,
      forwarderARN: 'arn:aws:lambda:us-east-1:601427279990:function:anthony-lam-dd-forwarder',
      enableDDTracing: true,
      flushMetricsToLogs: true,
      apiKey: '1234567890',
    });
    DatadogCDK.addLambdaFunctions([hello, hello1, hello2]);
  }
}

const app = new cdk.App();
new Example2Stack(app, 'Example2Stack');
app.synth();
