import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  DatadogLambda,
  API_KEY_ENV_VAR,
  KMS_API_KEY_ENV_VAR,
  SITE_URL_ENV_VAR,
  FLUSH_METRICS_TO_LOGS_ENV_VAR,
  ENABLE_DD_TRACING_ENV_VAR,
  INJECT_LOG_CONTEXT_ENV_VAR,
  ENABLE_DD_LOGS_ENV_VAR,
  API_KEY_SECRET_ARN_ENV_VAR,
  API_KEY_SSM_ARN_ENV_VAR,
  CAPTURE_LAMBDA_PAYLOAD_ENV_VAR,
  DD_HANDLER_ENV_VAR,
} from "../src/index";
const EXTENSION_LAYER_VERSION = 5;
const CUSTOM_EXTENSION_LAYER_ARN = "arn:aws:lambda:us-east-1:123456789:layer:Datadog-Extension-custom:1";
const NODE_LAYER_VERSION = 91;
const CUSTOM_NODE_LAYER_ARN = "arn:aws:lambda:us-east-1:123456789:layer:Datadog-Node-custom:1";
const PYTHON_LAYER_VERSION = 73;
const CUSTOM_PYTHON_LAYER_ARN = "arn:aws:lambda:us-east-1:123456789:layer:Datadog-Python-custom:1";

describe("SITE_URL_ENV_VAR", () => {
  it("applies site URL parameter correctly when flushMetricsToLogs is false", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
      site: "datadoghq.eu",
      flushMetricsToLogs: false,
      apiKey: "1234",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [SITE_URL_ENV_VAR]: "datadoghq.eu",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [API_KEY_ENV_VAR]: "1234",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
        },
      },
    });
  });

  it("applies default site URL parameter if undefined and flushMetricsToLogs is false", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
      flushMetricsToLogs: false,
      apiKey: "1234",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [API_KEY_ENV_VAR]: "1234",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
        },
      },
    });
  });

  it("applies default site URL parameter if undefined and extensionLayerVersion is set", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKey: "1234",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [API_KEY_ENV_VAR]: "1234",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "false",
        },
      },
    });
  });

  it("applies default site URL parameter if undefined and extensionLayerArn is set", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      extensionLayerArn: CUSTOM_EXTENSION_LAYER_ARN,
      apiKey: "1234",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [API_KEY_ENV_VAR]: "1234",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "false",
        },
      },
    });
  });

  it("applies site URL parameter correctly when extensionLayerVersion is set", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      site: "datadoghq.eu",
      apiKey: "1234",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [SITE_URL_ENV_VAR]: "datadoghq.eu",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [API_KEY_ENV_VAR]: "1234",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "false",
        },
      },
    });
  });

  it("applies site URL parameter correctly when extensionLayerArn is set", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      extensionLayerArn: CUSTOM_EXTENSION_LAYER_ARN,
      site: "datadoghq.eu",
      apiKey: "1234",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [SITE_URL_ENV_VAR]: "datadoghq.eu",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [API_KEY_ENV_VAR]: "1234",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "false",
        },
      },
    });
  });

  it("does not apply site URL parameter when flushMetricsToLogs is true", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
      flushMetricsToLogs: true,
      site: "datadoghq.eu",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
        },
      },
    });
  });
});

describe("FLUSH_METRICS_TO_LOGS_ENV_VAR", () => {
  it("applies log forwarding parameter correctly", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
      apiKey: "1234",
      flushMetricsToLogs: false,
      site: "datadoghq.com",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [API_KEY_ENV_VAR]: "1234",
        },
      },
    });
  });

  it("applies default log forwarding value if undefined", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
        },
      },
    });
  });

  it("overrides log forwarding value to false when extensionLayerVersion is set", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKey: "1234",
      flushMetricsToLogs: true,
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "false",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [API_KEY_ENV_VAR]: "1234",
        },
      },
    });
  });

  it("overrides log forwarding value to false when extensionLayerArn is set", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      extensionLayerArn: CUSTOM_EXTENSION_LAYER_ARN,
      apiKey: "1234",
      flushMetricsToLogs: true,
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "false",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [API_KEY_ENV_VAR]: "1234",
        },
      },
    });
  });
});

describe("API_KEY_ENV_VAR", () => {
  it("adds DD_API_KEY environment variable", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
      flushMetricsToLogs: false,
      site: "datadoghq.com",
      apiKey: "1234",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [API_KEY_ENV_VAR]: "1234",
        },
      },
    });
  });
});

describe("API_KEY_SECRET_ARN_ENV_VAR", () => {
  it("adds DD_API_KEY_SECRET_ARN environment variable", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
      apiKeySecretArn: "some-resource:from:aws:secrets-manager:arn",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "false",
          [API_KEY_SECRET_ARN_ENV_VAR]: "some-resource:from:aws:secrets-manager:arn",
        },
      },
    });
  });

  it("adds DD_API_KEY_SECRET_ARN environment variable for custom extension arn", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      extensionLayerArn: CUSTOM_EXTENSION_LAYER_ARN,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
      apiKeySecretArn: "some-resource:from:aws:secrets-manager:arn",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "false",
          [API_KEY_SECRET_ARN_ENV_VAR]: "some-resource:from:aws:secrets-manager:arn",
        },
      },
    });
  });

  it("doesn't set DD_API_KEY_SECRET_ARN when using synchronous metrics in node", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    expect(() => {
      const datadogLambda = new DatadogLambda(stack, "Datadog", {
        flushMetricsToLogs: false,
        site: "datadoghq.com",
        apiKeySecretArn: "some-resource:from:aws:secrets-manager:arn",
        nodeLayerVersion: NODE_LAYER_VERSION,
      });
      datadogLambda.addLambdaFunctions([hello]);
    }).toThrowError(
      `\`apiKeySecretArn\` is not supported for Node runtimes when using Synchronous Metrics. Use either \`apiKey\` or \`apiKmsKey\`.`,
    );
  });

  it("doesn't set DD_API_KEY_SECRET_ARN when using synchronous metrics in custom node", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    expect(() => {
      const datadogLambda = new DatadogLambda(stack, "Datadog", {
        flushMetricsToLogs: false,
        site: "datadoghq.com",
        apiKeySecretArn: "some-resource:from:aws:secrets-manager:arn",
        nodeLayerArn: CUSTOM_NODE_LAYER_ARN,
      });
      datadogLambda.addLambdaFunctions([hello]);
    }).toThrowError(
      `\`apiKeySecretArn\` is not supported for Node runtimes when using Synchronous Metrics. Use either \`apiKey\` or \`apiKmsKey\`.`,
    );
  });

  it("adds DD_API_KEY_SECRET_ARN when using synchronous metrics in python", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      flushMetricsToLogs: false,
      site: "datadoghq.com",
      apiKeySecretArn: "some-resource:from:aws:secrets-manager:arn",
      pythonLayerVersion: PYTHON_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [API_KEY_SECRET_ARN_ENV_VAR]: "some-resource:from:aws:secrets-manager:arn",
        },
      },
    });
  });
  it("adds DD_API_KEY_SECRET_ARN when using synchronous metrics in custom python", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      flushMetricsToLogs: false,
      site: "datadoghq.com",
      apiKeySecretArn: "some-resource:from:aws:secrets-manager:arn",
      pythonLayerArn: CUSTOM_PYTHON_LAYER_ARN,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [API_KEY_SECRET_ARN_ENV_VAR]: "some-resource:from:aws:secrets-manager:arn",
        },
      },
    });
  });
});
describe("API_KEY_SSM_ARN_ENV_VAR", () => {
  it("adds DD_API_KEY_SSM_ARN environment variable", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
      apiKeySsmArn: "/datadog/api_key",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "false",
          [API_KEY_SSM_ARN_ENV_VAR]: "/datadog/api_key",
        },
      },
    });
  });

  it("adds DD_API_KEY_SSM_ARN environment variable for custom extension arn", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      extensionLayerArn: CUSTOM_EXTENSION_LAYER_ARN,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
      apiKeySsmArn: "/datadog/api_key",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "false",
          [API_KEY_SSM_ARN_ENV_VAR]: "/datadog/api_key",
        },
      },
    });
  });

  it("sets DD_API_KEY_SSM_ARN when using synchronous metrics in node", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      flushMetricsToLogs: false,
      site: "datadoghq.com",
      apiKeySsmArn: "/datadog/api_key",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    const template = Template.fromStack(stack);
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          DD_API_KEY_SSM_ARN: "/datadog/api_key",
        },
      },
    });
  });

  it("sets DD_API_KEY_SSM_ARN when using synchronous metrics in custom node", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      flushMetricsToLogs: false,
      site: "datadoghq.com",
      apiKeySsmArn: "/datadog/api_key",
      nodeLayerArn: CUSTOM_NODE_LAYER_ARN,
    });
    datadogLambda.addLambdaFunctions([hello]);
    const template = Template.fromStack(stack);
    template.hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          DD_API_KEY_SSM_ARN: "/datadog/api_key",
        },
      },
    });
  });

  it("adds DD_API_KEY_SSM_ARN when using synchronous metrics in python", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      flushMetricsToLogs: false,
      site: "datadoghq.com",
      apiKeySsmArn: "/datadog/api_key",
      pythonLayerVersion: PYTHON_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [API_KEY_SSM_ARN_ENV_VAR]: "/datadog/api_key",
        },
      },
    });
  });
  it("adds DD_API_KEY_SSM_ARN when using synchronous metrics in custom python", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      flushMetricsToLogs: false,
      site: "datadoghq.com",
      apiKeySsmArn: "/datadog/api_key",
      pythonLayerArn: CUSTOM_PYTHON_LAYER_ARN,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [API_KEY_SSM_ARN_ENV_VAR]: "/datadog/api_key",
        },
      },
    });
  });
});
describe("apiKMSKeyEnvVar", () => {
  it("adds DD_KMS_API_KEY environment variable", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
      flushMetricsToLogs: false,
      site: "datadoghq.com",
      apiKmsKey: "5678",
      nodeLayerVersion: NODE_LAYER_VERSION,
    });
    datadogLambda.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [KMS_API_KEY_ENV_VAR]: "5678",
        },
      },
    });
  });
});
