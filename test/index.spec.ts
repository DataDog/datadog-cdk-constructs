import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as crypto from "crypto";
import "@aws-cdk/assert/jest";
import { addForwarder } from "../lib/forwarder";
import { Datadog, logForwardingEnvVar, enableDDTracingEnvVar, injectLogContextEnvVar } from "../lib/index";
import {
  JS_HANDLER_WITH_LAYERS,
  DD_HANDLER_ENV_VAR,
  PYTHON_HANDLER,
} from "../lib/redirect";
const SUBSCRIPTION_FILTER_PREFIX = "DatadogSubscriptionFilter";

function createSubscriptionFilterName(lambdaFunctionArn:string,forwarderArn:string){
  const subscriptionFilterValue: string = crypto.createHash("sha256").update(lambdaFunctionArn).update(forwarderArn).digest("hex");
    const subscriptionFilterValueLength = subscriptionFilterValue.length;
    const subscriptionFilterName = SUBSCRIPTION_FILTER_PREFIX + subscriptionFilterValue.substring(subscriptionFilterValueLength - 8, subscriptionFilterValueLength);
    return subscriptionFilterName;
}
describe("addForwarder", () => {
  it("Subscribes two seperate forwarder's to the same lambda via seperate addLambdaFunctions function calls",() => {
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
      nodeLayerVersion: 40,
      pythonLayerVersion: 28,
      addLayers: true,
      forwarderARN: "forwarder-arn",
      enableDDTracing: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([nodeLambda]);
    const datadogCdk2 = new Datadog(stack, "Datadog2", {
      nodeLayerVersion: 40,
      pythonLayerVersion: 28,
      addLayers: true,
      forwarderARN: "forwarder-arn2",
      enableDDTracing: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk2.addLambdaFunctions([nodeLambda]);
    expect(stack).toHaveResource("AWS::Logs::SubscriptionFilter", {
      DestinationArn: "forwarder-arn",
      FilterPattern: "",
    });
    expect(stack).toHaveResource("AWS::Logs::SubscriptionFilter", {
      DestinationArn: "forwarder-arn2",
      FilterPattern: "",
    });
  });

  it("Subscribes the same forwarder to two different lambda functions via seperate addLambdaFunctions function calls",() => {
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
      forwarderARN: "forwarder-arn",
      enableDDTracing: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([nodeLambda]);
    datadogCdk.addLambdaFunctions([pythonLambda]);
    const nodeLambdaLogGroupSubscriptionFilterName = createSubscriptionFilterName(nodeLambda.functionArn,"forwarder-arn")
    const pythonLambdaLogGroupSubscriptionFilterName = createSubscriptionFilterName(pythonLambda.functionArn,"forwarder-arn")
    expect(nodeLambda.logGroup.node.tryFindChild(nodeLambdaLogGroupSubscriptionFilterName)).not.toBeUndefined();
    expect(pythonLambda.logGroup.node.tryFindChild(pythonLambdaLogGroupSubscriptionFilterName)).not.toBeUndefined();
  });

  it("Subscribes the same forwarder to two different lambda functions via one addForwarder function call",() => {
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
    addForwarder(stack, [nodeLambda, pythonLambda], "forwarder-arn");
    const nodeLambdaLogGroupSubscriptionFilterName = createSubscriptionFilterName(nodeLambda.functionArn,"forwarder-arn")
    const pythonLambdaLogGroupSubscriptionFilterName = createSubscriptionFilterName(pythonLambda.functionArn,"forwarder-arn")
    expect(nodeLambda.logGroup.node.tryFindChild(nodeLambdaLogGroupSubscriptionFilterName)).not.toBeUndefined();
    expect(pythonLambda.logGroup.node.tryFindChild(pythonLambdaLogGroupSubscriptionFilterName)).not.toBeUndefined();
  });

  it("Throws an error when a customer redundantly calls the addLambdaFunctions function on the same lambda function(s) and forwarder",() => {
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
      forwarderARN: "forwarder-arn",
      enableDDTracing: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([nodeLambda]);
    let throwsError;
    try{
      datadogCdk.addLambdaFunctions([nodeLambda]);
    } catch(e) {
      throwsError = true;
    }
    expect(throwsError).toBe(true);
  });

  it("Subscribes two different forwarders to two different lambda functions via seperate addForwarder function calls",() => {
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
      forwarderARN: "forwarder-arn",
      enableDDTracing: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    const datadogCdk2 = new Datadog(stack, "Datadog2", {
      nodeLayerVersion: 20,
      pythonLayerVersion: 28,
      addLayers: true,
      forwarderARN: "forwarder-arn2",
      enableDDTracing: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([nodeLambda]);
    datadogCdk2.addLambdaFunctions([pythonLambda]);
    const nodeLambdaLogGroupSubscriptionFilterName = createSubscriptionFilterName(nodeLambda.functionArn,"forwarder-arn")
    const pythonLambdaLogGroupSubscriptionFilterName = createSubscriptionFilterName(pythonLambda.functionArn,"forwarder-arn2")
    expect(nodeLambda.logGroup.node.tryFindChild(nodeLambdaLogGroupSubscriptionFilterName)).not.toBeUndefined();
    expect(pythonLambda.logGroup.node.tryFindChild(pythonLambdaLogGroupSubscriptionFilterName)).not.toBeUndefined();
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
