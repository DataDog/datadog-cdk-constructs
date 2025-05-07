# API Gateway Tracing

This directory contains utilities and configurations for instrumenting AWS API Gateway (V1/REST API) with Datadog tracing. The instrumentation enables inferred spans for API Gateway requests, providing better visibility into your API traffic.

## Overview

API Gateway inferred spans allow you to track and monitor API requests through your API Gateway endpoints. This instrumentation adds necessary headers to your API Gateway integrations, enabling Datadog to properly trace and monitor your API traffic.

## Prerequisites

1. Your application must be running a supported web framework (see list below)

2. The API Gateway must be using the REST API option (API Gateway V1). API Gateway HTTP API (V2) is not supported.

3. Set `DD_TRACE_INFERRED_PROXY_SERVICES_ENABLED=true` in your application environment. If you're using the Datadog ECS Fargate construct, you can enable this by setting the `traceInferredProxyServices` property in the APM configuration:

  ```typescript
  const ecsDatadog = new DatadogECSFargate({
    // ... other configuration
    apm: {
      isEnabled: true,
      traceInferredProxyServices: true, // This sets DD_TRACE_INFERRED_PROXY_SERVICES_ENABLED=true
    },
  });
  ```

4. Use a supported version of the Datadog tracer:
   - For dd-trace-js 5.x: 5.26.0 or later
   - For dd-trace-js 4.x: 4.50.0 or later
   - For dd-trace-go: 1.72.1 or later
   - For dd-trace-py: 3.1.0 or later

// ...

## Important Notes

1. When using the default integration approach, be aware that if a custom integration is added to any resource, the instrumentation will not be applied to that resource.

2. Head-based sampling is still in effect when using this feature. Any sampling rules in use need to be adjusted for the new root span.

   Example: If you were using a sampling rule like:
   ```bash
   DD_TRACE_SAMPLING_RULES='[{"service": "pythonapp", "sample_rate": 0.5}]'
   ```

   You will need to change it in one of two ways:

   a. Change service name to the name of API Gateway:
   ```bash
   DD_TRACE_SAMPLING_RULES='[{"service": "nameofapigateway", "sample_rate": 0.5}]'
   ```

   b. Remove service name so sampling is done on the root span by default:
   ```bash
   DD_TRACE_SAMPLING_RULES='[{"sample_rate": 0.5}]'
   ```

   Any sampling rules based on `resource_name` for the original web application now need to be updated for the resource name of the API Gateway service.

## Implementation

There are two main ways to implement API Gateway instrumentation:

### 1. Default Integration (Recommended)

You can set up the instrumentation as a default integration when creating your RestApi object. This will automatically apply to all resources in your API unless overridden.

```typescript
const ddIntegration = new apigateway.Integration({
  type: apigateway.IntegrationType.HTTP_PROXY,
  integrationHttpMethod: 'ANY',
  options: {
    connectionType: apigateway.ConnectionType.INTERNET,
    requestParameters: {
      "integration.request.header.x-dd-proxy": "'aws-apigateway'",
      "integration.request.header.x-dd-proxy-request-time-ms": "context.requestTimeEpoch",
      "integration.request.header.x-dd-proxy-domain-name": "context.domainName",
      "integration.request.header.x-dd-proxy-httpmethod": "context.httpMethod",
      "integration.request.header.x-dd-proxy-path": "context.path",
      "integration.request.header.x-dd-proxy-stage": "context.stage",
    }
  },
  uri: `http://${loadBalancer.loadBalancerDnsName}`,
});

const api = new apigateway.RestApi(this, 'MyApi', {
  restApiName: 'my-api-gateway',
  deployOptions: { stageName: 'prod' },
  defaultIntegration: ddIntegration,   // Instrumentation applied here
});
```

### 2. Per-Resource Integration

Alternatively, you can manually add the instrumentation to each resource when calling `addMethod`:

```typescript
api.root.addMethod('ANY', ddIntegration);
const books = api.root.addResource('books');
books.addMethod('ANY', ddIntegration);
const book = books.addResource('{id}');
book.addMethod('ANY', ddIntegration);
```

## Important Notes

1. When using the default integration approach, be aware that if a custom integration is added to any resource, the instrumentation will not be applied to that resource.

2. The instrumentation adds several headers to track:
   - Request timing
   - Domain information
   - HTTP method
   - Path
   - Stage

3. For proper tracing, ensure your backend services are also instrumented with the Datadog tracer.

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
- chi.v5 / chi
- dimfeld/httptreemux.v5
- echo.v4 / echo v4 / echo v3
- emicklei/go-restful / go-restful / go-restful.v3
- fiber / gofiber/fiber.v2
- gin-gonic/gin / Gin
- gorilla/mux / Gorilla Mux
- julienschmidt/httprouter
- valyala/fasthttp.v1
- zenazn/goji.v1
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

- [API Gateway Inferred Spans Documentation](https://docs.datadoghq.com/tracing/trace_collection/api_gateway_inferred_spans/)
- [Example Implementation](https://github.com/nevilgeorge/dd-apigw-fargate-demo)