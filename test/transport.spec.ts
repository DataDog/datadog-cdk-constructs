import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import "@aws-cdk/assert/jest";
import {
  Datadog,
  apiKeyEnvVar,
  apiKeyKMSEnvVar,
  siteURLEnvVar,
  logForwardingEnvVar,
  enableDDTracingEnvVar,
  injectLogContextEnvVar,
} from "../lib/index";
import { DD_HANDLER_ENV_VAR } from "../lib/redirect";

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
      forwarderARN: "forwarder-arn",
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
      forwarderARN: "forwarder-arn",
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
      forwarderARN: "forwarder-arn",
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
  it("appies default log forwarding value if undefined", () => {
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
      forwarderARN: "forwarder-arn",
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

describe("apiKeyEnvVar", () => {
  it("sets a DD_API_KEY environment variable when flushMetricsToLogs is false", () => {
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
      forwarderARN: "forwarder-arn",
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
  it("does not set a DD_API_KEY environment variable when flushMetricsToLogs is true", () => {
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
      forwarderARN: "forwarder-arn",
      apiKey: "1234",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [logForwardingEnvVar]: "true",
          [enableDDTracingEnvVar]: "true",
          [injectLogContextEnvVar]: "true",
        },
      },
    });
  });
  it("throws error if flushMetricsToLogs is false and both API key and KMS API key are defined", () => {
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
    expect(() => {
      const datadogCDK = new Datadog(stack, "Datadog", {
        forwarderARN: "forwarder-arn",
        flushMetricsToLogs: false,
        site: "datadoghq.com",
        apiKey: "1234",
        apiKMSKey: "5678",
      });
      datadogCDK.addLambdaFunctions([hello]);
    }).toThrowError(
      "The parameters apiKey and apiKMSKey are mutually exclusive. Please set one or the other but not both if flushMetricsToLogs is set to false.",
    );
  });
  it("throws error if flushMetricsToLogs is false and both API key and KMS API key are not defined", () => {
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
    expect(() => {
      const datadogCDK = new Datadog(stack, "Datadog", {
        forwarderARN: "forwarder-arn",
        flushMetricsToLogs: false,
        site: "datadoghq.com",
      });
      datadogCDK.addLambdaFunctions([hello]);
    }).toThrowError(
      "The parameters apiKey and apiKMSKey are mutually exclusive. Please set one or the other but not both if flushMetricsToLogs is set to false.",
    );
  });
});

describe("apiKMSKeyEnvVar", () => {
  it("sets an DD_KMS_API_KEY environment variable when flushMetricsToLogs is false", () => {
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
      forwarderARN: "forwarder-arn",
      flushMetricsToLogs: false,
      site: "datadoghq.com",
      apiKMSKey: "5678",
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
  it("does not set DD_KMS_API_KEY environment variable when flushMetricsToLogs is true", () => {
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
      forwarderARN: "forwarder-arn",
      apiKMSKey: "5678",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [logForwardingEnvVar]: "true",
          [enableDDTracingEnvVar]: "true",
          [injectLogContextEnvVar]: "true",
        },
      },
    });
  });
});
