import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import "@aws-cdk/assert/jest";
import { addForwarder } from "../lib/forwarder";
import { Datadog, logForwardingEnvVar, enableDDTracingEnvVar, injectLogContextEnvVar } from "../lib/index";
import {
  JS_HANDLER_WITH_LAYERS,
  DD_HANDLER_ENV_VAR,
  PYTHON_HANDLER,
} from "../lib/redirect";
describe("addForwarder", () => {
  it("bypasses any attempts to make a second `forwarder` construct",() => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const pythonLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    addForwarder(stack, [pythonLambda], "forwarder-arn");
    addForwarder(stack, [pythonLambda], "forwarder-arn");
    expect(stack).toHaveResource("AWS::Logs::SubscriptionFilter", {
      DestinationArn: "forwarder-arn",
      FilterPattern: "",
    });
  });
});
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
    const datadogCDK = new Datadog(stack, "Datadog", {
      nodeLayerVersion: 39,
      pythonLayerVersion: 24,
      forwarderARN: "forwarder-arn",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Handler: `${JS_HANDLER_WITH_LAYERS}`,
    });
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
    const datadogCDK = new Datadog(stack, "Datadog", {
      nodeLayerVersion: 39,
      pythonLayerVersion: 24,
      forwarderARN: "forwarder-arn",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Handler: `${PYTHON_HANDLER}`,
    });
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

    const datadogCDK = new Datadog(stack, "Datadog", {
      nodeLayerVersion: 39,
      pythonLayerVersion: 24,
      forwarderARN: "forwarder-arn",
    });
    datadogCDK.addLambdaFunctions([hello, hello1, hello2]);
    expect(stack).toHaveResource("AWS::Logs::SubscriptionFilter");
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Handler: `${PYTHON_HANDLER}`,
    });
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
