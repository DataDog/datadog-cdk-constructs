import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';

export const DatadogAPIGatewayRequestParameters = {
  "integration.request.header.x-dd-proxy": "'aws-apigateway'",
  "integration.request.header.x-dd-proxy-request-time-ms": "context.requestTimeEpoch",
  "integration.request.header.x-dd-proxy-domain-name": "context.domainName",
  "integration.request.header.x-dd-proxy-httpmethod": "context.httpMethod",
  "integration.request.header.x-dd-proxy-path": "context.path",
  "integration.request.header.x-dd-proxy-stage": "context.stage",
}

// TODO: make this a function that takes an optional existing parameter mapping
// and returns a new one with the same values
export DatadogAPIGatewayV2ParameterMapping = new apigatewayv2.ParameterMapping()
  .appendHeader('x-dd-proxy', apigatewayv2.MappingValue.custom("'aws-apigateway'"))
  .appendHeader('x-dd-proxy-request-time-ms', apigatewayv2.MappingValue.custom('${context.requestTimeEpoch}000'))
  .appendHeader('x-dd-proxy-domain-name', apigatewayv2.MappingValue.custom('$context.domainName'))
  .appendHeader('x-dd-proxy-httpmethod', apigatewayv2.MappingValue.custom('$context.httpMethod'))
  .appendHeader('x-dd-proxy-path', apigatewayv2.MappingValue.custom('$context.path'))
  .appendHeader('x-dd-proxy-stage', apigatewayv2.MappingValue.custom('$context.stage'))
