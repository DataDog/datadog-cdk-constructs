export const DatadogAPIGatewayRequestParameters = {
  "integration.request.header.x-dd-proxy": "'aws-apigateway'",
  "integration.request.header.x-dd-proxy-request-time-ms": "context.requestTimeEpoch",
  "integration.request.header.x-dd-proxy-domain-name": "context.domainName",
  "integration.request.header.x-dd-proxy-httpmethod": "context.httpMethod",
  "integration.request.header.x-dd-proxy-path": "context.path",
  "integration.request.header.x-dd-proxy-stage": "context.stage",
}
