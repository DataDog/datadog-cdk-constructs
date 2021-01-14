import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import "@aws-cdk/assert/jest";
import { Datadog } from "../lib/index";
import { siteURLEnvVar, logForwardingEnvVar, logLevelEnvVar, enableDDTracingEnvVar } from "../lib/environment";
import {
  JS_HANDLER_WITH_LAYERS,
  DD_HANDLER_ENV_VAR,
  PYTHON_HANDLER,
} from "../lib/redirect";
describe("applyLayers", () => {
  it("if addLayers is not given, layer is added", () => {
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
    new Datadog(stack, "Datadog", {
      lambdaFunctions: [hello],
      nodeLayerVersion: 39,
      pythonLayerVersion: 24,
      forwarderARN: "forwarder-arn",
    });
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Handler: `${JS_HANDLER_WITH_LAYERS}`,
    });
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [siteURLEnvVar]: "datadoghq.com",
          [logForwardingEnvVar]: "true",
          [logLevelEnvVar]: "info",
          [enableDDTracingEnvVar]: "true"
        },
      },
    });
  });
  it("layer is added for python", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_6,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    new Datadog(stack, "Datadog", {
      lambdaFunctions: [hello],
      nodeLayerVersion: 39,
      pythonLayerVersion: 24,
      forwarderARN: "forwarder-arn",
    });
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Handler: `${PYTHON_HANDLER}`,
    });
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [siteURLEnvVar]: "datadoghq.com",
          [logForwardingEnvVar]: "true",
          [logLevelEnvVar]: "info",
          [enableDDTracingEnvVar]: "true"
        },
      },
    });
  });

  it("subscription filter is added", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_6,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const hello1 = new lambda.Function(stack, "HelloHandler1", {
      runtime: lambda.Runtime.PYTHON_3_6,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const hello2 = new lambda.Function(stack, "HelloHandler2", {
      runtime: lambda.Runtime.PYTHON_3_6,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });

    new Datadog(stack, "Datadog", {
      lambdaFunctions: [hello, hello1, hello2],
      nodeLayerVersion: 39,
      pythonLayerVersion: 24,
      forwarderARN: "forwarder-arn",
    });
    expect(stack).toHaveResource("AWS::Logs::SubscriptionFilter");
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Handler: `${PYTHON_HANDLER}`,
    });
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [siteURLEnvVar]: "datadoghq.com",
          [logForwardingEnvVar]: "true",
          [logLevelEnvVar]: "info",
          [enableDDTracingEnvVar]: "true"
        },
      },
    });
  });
});
