/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as apigatewayv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as apigatewayv2_integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { DatadogAPIGatewayRequestParameters } from "../../../src/index";
import { DatadogAPIGatewayV2ParameterMapping } from "../../../src/index";
import { Stack, StackProps, App } from "aws-cdk-lib";

export class ExampleStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // API Gateway v1
    const integrationV1 = new apigateway.Integration({
      type: apigateway.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'ANY',
      options: { connectionType: apigateway.ConnectionType.INTERNET },
      uri: 'https://example.com',
    });

    const restApi = new apigateway.RestApi(this, 'restApi', {
      restApiName: 'restApiName',
      description: 'API Gateway v1 for forwarding requests to example.com',
      deployOptions: { stageName: 'prod' },
      defaultIntegration: integrationV1,
      parameters: DatadogAPIGatewayRequestParameters,
    });

    restApi.root.addMethod('ANY');
    const magazines = restApi.root.addResource('magazines');
    magazines.addMethod('ANY');
    const magazine = magazines.addResource('{id}');
    magazine.addMethod('ANY');

    // API Gateway v2
    const integrationV2 = new apigatewayv2_integrations.HttpUrlIntegration(
      'HttpUrlIntegration',
      'https://example.com',
      { parameterMapping: DatadogAPIGatewayV2ParameterMapping },
    );

    const httpApi = new apigatewayv2.HttpApi(this, 'httpApi', {
      apiName: 'httpApiName',
      description: 'API Gateway v2 for forwarding requests to example.com',
    });

    httpApi.addRoutes({
      path: '/{proxy+}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: integrationV2,
    });
    httpApi.addRoutes({
      path: '/books',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: integrationV2,
    });
    httpApi.addRoutes({
      path: '/books/{id}',
      methods: [apigatewayv2.HttpMethod.ANY],
      integration: integrationV2,
    });
  }
}

const app = new App();
const env = { account: "601427279990", region: "sa-east-1" };
const stack = new ExampleStack(app, "apigateway-stack", { env: env });
console.log("Stack name: " + stack.stackName);
app.synth();
