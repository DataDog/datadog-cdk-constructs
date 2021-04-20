import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import "@aws-cdk/assert/jest";
import { Datadog, logForwardingEnvVar, enableDDTracingEnvVar, injectLogContextEnvVar } from "../src/index";
import { JS_HANDLER_WITH_LAYERS, DD_HANDLER_ENV_VAR, PYTHON_HANDLER } from "../src/redirect";
import { findDatadogSubscriptionFilters } from "./test-utils";

describe("addLambdaFunctions", () => {
  it("Subscribes the same forwarder to two different lambda functions via separate addLambdaFunctions function calls", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const nodeLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const pythonLambda = new lambda.Function(stack, "PythonHandler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const datadogCdk = new Datadog(stack, "Datadog", {
      nodeLayerVersion: 20,
      pythonLayerVersion: 28,
      addLayers: true,
      forwarderArn: "forwarder-arn",
      enableDatadogTracing: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([nodeLambda]);
    datadogCdk.addLambdaFunctions([pythonLambda]);

    const nodeLambdaSubscriptionFilters = findDatadogSubscriptionFilters(nodeLambda);
    const pythonLambdaSubscriptionFilters = findDatadogSubscriptionFilters(pythonLambda);
    expect(nodeLambdaSubscriptionFilters).toHaveLength(1);
    expect(pythonLambdaSubscriptionFilters).toHaveLength(1);
    expect(nodeLambdaSubscriptionFilters[0].destinationArn).toEqual(pythonLambdaSubscriptionFilters[0].destinationArn);
  });

  it("Throws an error when a customer redundantly calls the addLambdaFunctions function on the same lambda function(s) and forwarder", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const nodeLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const datadogCdk = new Datadog(stack, "Datadog", {
      nodeLayerVersion: 20,
      pythonLayerVersion: 28,
      addLayers: true,
      forwarderArn: "forwarder-arn",
      enableDatadogTracing: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([nodeLambda]);
    let throwsError;
    try {
      datadogCdk.addLambdaFunctions([nodeLambda]);
    } catch (e) {
      throwsError = true;
    }
    expect(throwsError).toBe(true);
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
      forwarderArn: "forwarder-arn",
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
      forwarderArn: "forwarder-arn",
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
      forwarderArn: "forwarder-arn",
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
