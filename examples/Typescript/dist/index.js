"use strict";
/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleStack = void 0;
const cdk = require("@aws-cdk/core");
const lambda = require("@aws-cdk/aws-lambda");
const datadog_cdk_constructs_1 = require("datadog-cdk-constructs");
class ExampleStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const hello = new lambda.Function(this, "hello", {
            runtime: lambda.Runtime.NODEJS_10_X,
            code: lambda.Code.fromAsset("lambda"),
            handler: "hello.handler",
        });
        const hello1 = new lambda.Function(this, "hello1", {
            runtime: lambda.Runtime.PYTHON_3_7,
            code: lambda.Code.fromAsset("lambda"),
            handler: "hello_py.lambda_handler",
        });
        const datadogForwarderArn = new cdk.CfnParameter(this, "datadogForwarderArn", {
            type: "String",
            description: "The Arn of the Datadog AWS Lambda forwarder function which will send data to Datadog.",
        });
        const DatadogCDK = new datadog_cdk_constructs_1.Datadog(this, "Datadog", {
            nodeLayerVersion: 85,
            pythonLayerVersion: 65,
            addLayers: true,
            forwarderArn: datadogForwarderArn.valueAsString,
            enableDatadogTracing: true,
            flushMetricsToLogs: true,
            site: "datadoghq.com",
        });
        DatadogCDK.addLambdaFunctions([hello, hello1]);
    }
}
exports.ExampleStack = ExampleStack;
const app = new cdk.App();
new ExampleStack(app, "CDK-Demo-Typescript");
app.synth();
