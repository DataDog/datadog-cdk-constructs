# API Gateway tracing

Enable Datadog tracing for AWS API Gateway (REST and HTTP APIs) with synthetic spans and enhanced observability.

This directory contains utilities and configurations for instrumenting AWS API Gateway (both v1/REST and v2/HTTP) with Datadog tracing. The instrumentation injects headers into API Gateway integrations, enabling Datadog to trace and monitor your API traffic.


<div class="alert alert-warning"> <p><strong>Not for Lambda-backed endpoints.</strong><br> If API Gateway fronts an AWS Lambda, use <a href="https://docs.datadoghq.com/serverless/aws_lambda/installation/">Datadog Lambda Layers</a> instead. Applying both mechanisms can create duplicate spans.</p> </div>

## Prerequisites

1. Your application is running a [supported web framework](#supported-versions-and-frameworks).

1. Your application is instrumented with a [supported Datadog tracer version](#supported-versions-and-frameworks).

1. `DD_TRACE_INFERRED_PROXY_SERVICES_ENABLED` is set to `true` in your application environment.
   If you're using the Datadog ECS Fargate construct, you can enable this by setting the `traceInferredProxyServices` property in the APM configuration:

   ```typescript
   const ecsDatadog = new DatadogECSFargate({
     // ... other configuration
     apm: {
       isEnabled: true,
       traceInferredProxyServices: true, // this sets DD_TRACE_INFERRED_PROXY_SERVICES_ENABLED=true
     },
   });
   ```

### Supported versions and web frameworks

| Runtime | Datadog Tracer | Tracer version       | Frameworks                                                                                                                            |
| ------- | -------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js | `dd-trace-js`  | v4.50.0+ or v5.26.0+ | express, fastify, hapi, koa, microgateway-core, next, paperplane, restify, router, apollo                                             |
| Go      | `dd-trace-go`  | v1.72.1+             | chi (v5), httptreemux (v5), echo (v3-v4), go-restful (v3), fiber (v2), gin, gorilla/mux, httprouter, fasthttp (v1), goji (v1), gqlgen |
| Python  | `dd-trace-py`  | v3.1.0+              | aiohttp, asgi, bottle, cherrypy, django/djangorestframework, falcon, fastapi, flask, molten, pyramid, sanic, starlette, tornado, wsgi |

## API Gateway v1 (REST APIs)

There are three ways to implement API Gateway instrumentation:

### 1. RestApi parameters (recommended)

Add Datadog instrumentation headers to your API Gateway request parameters. These parameters apply to every resource.

```typescript
import { DatadogAPIGatewayRequestParameters } from "datadog-cdk-constructs-v2";

const api = new apigateway.RestApi(this, "MyApi", {
  restApiName: "my-api-gateway",
  deployOptions: { stageName: "prod" },
  parameters: DatadogAPIGatewayRequestParameters, // Datadog instrumentation applied here
});
```

### 2. Default integration

Set up the instrumentation as a default integration when creating your RestApi object. Default instrumentation applies to all resources in your API except those that have custom integrations. For those resources, add the headers manually or use the [per-resource pattern](#per-resource-integration).

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

### 3. Per-resource integration

Manually add the instrumentation to each resource when calling `addMethod`. This approach is required for resources with custom integrations.

```typescript
api.root.addMethod("ANY", ddIntegration); // Datadog instrumentation applied here
const books = api.root.addResource("books");
books.addMethod("ANY", ddIntegration); // Datadog instrumentation applied here
const book = books.addResource("{id}");
book.addMethod("ANY", ddIntegration); // Datadog instrumentation applied here
```

## API Gateway v2 (HTTP APIs)

Add Datadog instrumentation by using the `DatadogAPIGatewayV2ParameterMapping` constant, which contains the necessary parameter mappings for tracing.

<div class="alert alert-info"> <p><code>context.requestTimeEpoch</code> on v2 APIs provides only second-level granularity, so synthetic span duration is approximate. This does not affect tags, Trace Maps, or span linkage.</p> </div>

```typescript
// Datadog integration definition
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

## Tracing behavior and configuration notes

1. Head-based sampling is still in effect when using this feature. Any sampling rules in use need to be adjusted for the new root span. The service name must match the API Gateway's name as seen in Datadog.

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

   Any sampling rules based on `resource_name` for the original web application must be updated for the resource name of the API Gateway service.

1. The instrumentation adds headers to track the following:

   - Request timing
   - Domain information
   - HTTP method
   - Path
   - Stage

1. For proper tracing, ensure your backend services are also instrumented with the Datadog tracer.

## References

- [Instrumenting Amazon API Gateway Documentation](https://docs.datadoghq.com/tracing/trace_collection/proxy_setup/apigateway)
- [Example Implementation](https://github.com/nevilgeorge/dd-apigw-fargate-demo)
