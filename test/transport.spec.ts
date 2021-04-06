import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import "@aws-cdk/assert/jest";
import {
  Datadog,
  apiKeyEnvVar,
  apiKeyKMSEnvVar,
  siteURLEnvVar,
  logForwardingEnvVar,
  enableDDTracingEnvVar,
  injectLogContextEnvVar,
} from "../src/index";
import { DD_HANDLER_ENV_VAR } from "../src/redirect";
const EXTENSION_LAYER_VERSION = 5;

describe("siteURLEnvVar", () => {
  it("applies site URL parameter correctly when flushMetricsToLogs is false", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      forwarderArn: "forwarder-arn",
      site: "datadoghq.eu",
      flushMetricsToLogs: false,
      apiKey: "1234",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [siteURLEnvVar]: "datadoghq.eu",
          [logForwardingEnvVar]: "false",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [apiKeyEnvVar]: "1234",
          [enableDDTracingEnvVar]: "true",
          [injectLogContextEnvVar]: "true",
        },
      },
    });
  });

  it("applies default site URL parameter if undefined and flushMetricsToLogs is false", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      forwarderArn: "forwarder-arn",
      flushMetricsToLogs: false,
      apiKey: "1234",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [logForwardingEnvVar]: "false",
          [siteURLEnvVar]: "datadoghq.com",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [apiKeyEnvVar]: "1234",
          [enableDDTracingEnvVar]: "true",
          [injectLogContextEnvVar]: "true",
        },
      },
    });
  });

  it("applies default site URL parameter if undefined and extensionLayerVersion is set", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKey: "1234",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [logForwardingEnvVar]: "false",
          [siteURLEnvVar]: "datadoghq.com",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [apiKeyEnvVar]: "1234",
          [enableDDTracingEnvVar]: "true",
          [injectLogContextEnvVar]: "true",
        },
      },
    });
  });

  it("applies site URL parameter correctly when extensionLayerVersion is set", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      site: "datadoghq.eu",
      apiKey: "1234",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [logForwardingEnvVar]: "false",
          [siteURLEnvVar]: "datadoghq.eu",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [apiKeyEnvVar]: "1234",
          [enableDDTracingEnvVar]: "true",
          [injectLogContextEnvVar]: "true",
        },
      },
    });
  });

  it("does not apply site URL parameter when flushMetricsToLogs is true", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      forwarderArn: "forwarder",
      flushMetricsToLogs: true,
      site: "datadoghq.eu",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [logForwardingEnvVar]: "true",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [enableDDTracingEnvVar]: "true",
          [injectLogContextEnvVar]: "true",
        },
      },
    });
  });
});

describe("logForwardingEnvVar", () => {
  it("applies log forwarding parameter correctly", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      forwarderArn: "forwarder-arn",
      apiKey: "1234",
      flushMetricsToLogs: false,
      site: "datadoghq.com",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [siteURLEnvVar]: "datadoghq.com",
          [logForwardingEnvVar]: "false",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [enableDDTracingEnvVar]: "true",
          [injectLogContextEnvVar]: "true",
          [apiKeyEnvVar]: "1234",
        },
      },
    });
  });

  it("applies default log forwarding value if undefined", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      forwarderArn: "forwarder-arn",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [logForwardingEnvVar]: "true",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [enableDDTracingEnvVar]: "true",
          [injectLogContextEnvVar]: "true",
        },
      },
    });
  });

  it("overrides log forwarding value to false when extensionLayerVersion is set", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKey: "1234",
      flushMetricsToLogs: true,
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [logForwardingEnvVar]: "false",
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [enableDDTracingEnvVar]: "true",
          [injectLogContextEnvVar]: "true",
          [siteURLEnvVar]: "datadoghq.com",
          [apiKeyEnvVar]: "1234",
        },
      },
    });
  });
});

describe("apiKeyEnvVar", () => {
  it("adds DD_API_KEY environment variable", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      forwarderArn: "forwarder-arn",
      flushMetricsToLogs: false,
      site: "datadoghq.com",
      apiKey: "1234",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [siteURLEnvVar]: "datadoghq.com",
          [logForwardingEnvVar]: "false",
          [enableDDTracingEnvVar]: "true",
          [injectLogContextEnvVar]: "true",
          [apiKeyEnvVar]: "1234",
        },
      },
    });
  });
});

describe("apiKMSKeyEnvVar", () => {
  it("adds DD_KMS_API_KEY environment variable", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      forwarderArn: "forwarder-arn",
      flushMetricsToLogs: false,
      site: "datadoghq.com",
      apiKmsKey: "5678",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [siteURLEnvVar]: "datadoghq.com",
          [logForwardingEnvVar]: "false",
          [enableDDTracingEnvVar]: "true",
          [injectLogContextEnvVar]: "true",
          [apiKeyKMSEnvVar]: "5678",
        },
      },
    });
  });
});
