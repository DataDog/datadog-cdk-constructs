# API Gateway Tracing

Enable Datadog tracing for AWS API Gateway (REST and HTTP APIs) with synthetic spans and enhanced observability.

This directory contains utilities and configurations for instrumenting AWS API Gateway (both v1/REST and v2/HTTP) with Datadog tracing. The instrumentation injects headers into API Gateway integrations, enabling Datadog to trace and monitor your API traffic.

> **⚠️ WARNING:**
> This instrumentation is **NOT** intended for use with API Gateway endpoints that integrate with AWS Lambda functions. If your API Gateway is fronting a Lambda, use the [Datadog Lambda Layers](https://docs.datadoghq.com/serverless/aws_lambda/installation/) instead. The Lambda Layers provide out-of-the-box instrumentation, including synthetic spans, and applying this instrumentation in addition may result in duplicate or conflicting traces.

## Overview

API Gateway synthetic spans allow you to track and monitor API requests through your API Gateway endpoints. This instrumentation adds necessary headers to your API Gateway integrations, enabling Datadog to properly trace and monitor your API traffic.

## Prerequisites

1. Your application must be running a supported web framework (see list below).

2. Set `DD_TRACE_INFERRED_PROXY_SERVICES_ENABLED=true` in your application environment. If you're using the Datadog ECS Fargate construct, you can enable this by setting the `traceInferredProxyServices` property in the APM configuration:

```typescript
const ecsDatadog = new DatadogECSFargate({
  // ... other configuration
  apm: {
    isEnabled: true,
    traceInferredProxyServices: true, // This sets DD_TRACE_INFERRED_PROXY_SERVICES_ENABLED=true
  },
});
```

3. Use a supported version of the Datadog tracer:

| Tracer          | Minimum Version |
| --------------- | --------------- |
| dd-trace-js 5.x | 5.26.0          |
| dd-trace-js 4.x | 4.50.0          |
| dd-trace-go     | 1.72.1          |
| dd-trace-py     | 3.1.0           |

## Important Notes

1. When using the default integration approach, be aware that if a custom integration is added to any resource, the instrumentation will not be applied to that resource.

2. For API Gateway v2 (HTTP APIs), `context.requestTimeEpoch` only provides second-level granularity, unlike v1 (REST APIs) which provides millisecond precision. This means the duration of synthetic spans for v2 APIs will be less accurate. While these spans are still valuable for Trace Maps and other attributes/tags, we recommend not relying on their duration values.

3. Head-based sampling is still in effect when using this feature. Any sampling rules in use need to be adjusted for the new root span. The service name must match the API Gateway's name as seen in Datadog.

   Example: If you were using a sampling rule like:

   ```bash
   DD_TRACE_SAMPLING_RULES='[{"service": "pythonapp", "sample_rate": 0.5}]'
   ```

   You will need to update your sampling rules:

   - **Option 1:** Change the `service` value to match your API Gateway's name as it appears in Datadog:
     ```bash
     DD_TRACE_SAMPLING_RULES='[{"service": "my-api-gateway", "sample_rate": 0.5}]'
     ```
   - **Option 2:** Remove the `service` key to apply the rule to all root spans:
     ```bash
     DD_TRACE_SAMPLING_RULES='[{"sample_rate": 0.5}]'
     ```

   Any sampling rules based on `resource_name` for the original web application now need to be updated for the resource name of the API Gateway service.

4. The instrumentation adds several headers to track:

   - Request timing
   - Domain information
   - HTTP method
   - Path
   - Stage

5. For proper tracing, ensure your backend services are also instrumented with the Datadog tracer.

## API Gateway v1 (REST APIs)

There are three main ways to implement API Gateway instrumentation:

### 1. RestApi Parameters (Recommended)

This approach adds the necessary Datadog instrumentation headers to your API Gateway request parameters. These parameters will be applied to every resource, independent of any integrations also added.

```typescript
import { DatadogAPIGatewayRequestParameters } from "datadog-cdk-constructs-v2";

const api = new apigateway.RestApi(this, "MyApi", {
  restApiName: "my-api-gateway",
  deployOptions: { stageName: "prod" },
  parameters: DatadogAPIGatewayRequestParameters, // Datadog instrumentation applied here
});
```

### 2. Default Integration

You can also set up the instrumentation as a default integration when creating your RestApi object. This will automatically apply to all resources in your API unless a resource has a custom integration, in which case the default instrumentation will not be applied.

```typescript
import { DatadogAPIGatewayRequestParameters } from "datadog-cdk-constructs-v2";

// Datadog integration definition
const ddIntegration = new apigateway.Integration({
  type: apigateway.IntegrationType.HTTP_PROXY,
  integrationHttpMethod: "ANY",
  options: {
    connectionType: apigateway.ConnectionType.INTERNET,
    requestParameters: DatadogAPIGatewayRequestParameters,
  },
  uri: `http://${loadBalancer.loadBalancerDnsName}`,
});

const api = new apigateway.RestApi(this, "MyApi", {
  restApiName: "my-api-gateway",
  deployOptions: { stageName: "prod" },
  defaultIntegration: ddIntegration, // Datadog instrumentation applied here
});
```

Note: Resources with custom integrations will not inherit the default Datadog instrumentation. For these resources, you must either:

- Add the instrumentation headers manually, or
- Follow the per-resource integration steps in the next section.

### 3. Per-Resource Integration

Alternatively, you can manually add the instrumentation to each resource when calling `addMethod`. This is necessary for resources with custom integrations:

```typescript
api.root.addMethod("ANY", ddIntegration); // Datadog instrumentation applied here
const books = api.root.addResource("books");
books.addMethod("ANY", ddIntegration); // Datadog instrumentation applied here
const book = books.addResource("{id}");
book.addMethod("ANY", ddIntegration); // Datadog instrumentation applied here
```

## API Gateway v2 (HTTP APIs)

You can add Datadog instrumentation by using the `DatadogAPIGatewayV2ParameterMapping` constant, which contains the necessary parameter mappings for tracing.

**Note:** For v2 APIs, `context.requestTimeEpoch` only provides second-level granularity, unlike v1 (REST APIs) which provides millisecond precision. This means the duration of synthetic spans for v2 APIs will be less accurate. While these spans are still valuable for Trace Maps and other attributes/tags, we recommend not relying on their duration values.

```typescript
// datadog integration definition
const ddIntegration = new apigatewayv2_integrations.HttpUrlIntegration("HttpUrlIntegration", "https://example.com", {
  parameterMapping: DatadogAPIGatewayV2ParameterMapping,
});

const httpApi = new apigatewayv2.HttpApi(this, "httpApi", {
  apiName: "httpApiName",
  description: "API Gateway v2 for forwarding requests to example.com",
});

httpApi.addRoutes({
  path: "/{proxy+}",
  methods: [apigatewayv2.HttpMethod.ANY],
  integration: ddIntegration, // Datadog instrumentation applied here
});
httpApi.addRoutes({
  path: "/books",
  methods: [apigatewayv2.HttpMethod.ANY],
  integration: ddIntegration, // Datadog instrumentation applied here
});
httpApi.addRoutes({
  path: "/books/{id}",
  methods: [apigatewayv2.HttpMethod.ANY],
  integration: ddIntegration, // Datadog instrumentation applied here
});
```

## Supported Web Frameworks

### Node.js

- express
- fastify
- hapi
- koa
- microgateway-core
- next
- paperplane
- restify
- router
- apollo

### Go

- chi (v5)
- dimfeld/httptreemux (v5)
- echo (v3, v4)
- emicklei/go-restful (v3)
- fiber (v2)
- gin-gonic/gin
- gorilla/mux
- julienschmidt/httprouter
- valyala/fasthttp (v1)
- zenazn/goji (v1)
- 99designs/gqlgen

### Python

- aiohttp
- asgi
- bottle
- cherrypy
- django
- djangorestframework
- falcon
- fastapi
- flask
- molten
- pyramid
- sanic
- starlette
- tornado
- wsgi

## References

- [Instrumenting Amazon API Gateway Documentation](https://docs.datadoghq.com/tracing/trace_collection/proxy_setup/apigateway)
- [Example Implementation](https://github.com/nevilgeorge/dd-apigw-fargate-demo)
