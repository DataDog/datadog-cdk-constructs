import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import "@aws-cdk/assert/jest";
import { Datadog } from "../src/index";
const EXTENSION_LAYER_VERSION = 5;
const NODE_LAYER_VERSION = 1;

describe("validateProps", () => {
  it("throws error if both API key and KMS API key are defined", () => {
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
        forwarderArn: "forwarder-arn",
        flushMetricsToLogs: false,
        site: "datadoghq.com",
        apiKey: "1234",
        apiKmsKey: "5678",
      });
      datadogCDK.addLambdaFunctions([hello]);
    }).toThrowError("Both `apiKey` and `apiKmsKey` cannot be set.");
  });

  it("throws an error when the site is set to an invalid site URL", () => {
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
    let threwError = false;
    let thrownError: Error | undefined;
    try {
      const datadogCdk = new Datadog(stack, "Datadog", {
        nodeLayerVersion: NODE_LAYER_VERSION,
        extensionLayerVersion: EXTENSION_LAYER_VERSION,
        apiKey: "1234",
        enableDatadogTracing: false,
        flushMetricsToLogs: false,
        site: "dataDOGEhq.com",
      });
      datadogCdk.addLambdaFunctions([hello]);
    } catch (e) {
      threwError = true;
      thrownError = e;
    }
    expect(threwError).toBe(true);
    expect(thrownError?.message).toEqual(
      "Warning: Invalid site URL. Must be either datadoghq.com, datadoghq.eu, us3.datadoghq.com, or ddog-gov.com.",
    );
  });

  it("throws error if flushMetricsToLogs is false and both API key and KMS API key are undefined", () => {
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
        forwarderArn: "forwarder-arn",
        flushMetricsToLogs: false,
        site: "datadoghq.com",
      });
      datadogCDK.addLambdaFunctions([hello]);
    }).toThrowError("When `flushMetricsToLogs` is false, `apiKey` or `apiKmsKey` must also be set.");
  });

  it("throws an error when the extensionLayerVersion and forwarderArn are set", () => {
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

    let threwError = false;
    let thrownError: Error | undefined;
    try {
      const datadogCdk = new Datadog(stack, "Datadog", {
        nodeLayerVersion: NODE_LAYER_VERSION,
        extensionLayerVersion: EXTENSION_LAYER_VERSION,
        forwarderArn: "forwarder",
        apiKey: "1234",
        addLayers: true,
        enableDatadogTracing: false,
        flushMetricsToLogs: true,
        site: "datadoghq.com",
      });
      datadogCdk.addLambdaFunctions([hello]);
    } catch (e) {
      threwError = true;
      thrownError = e;
    }
    expect(threwError).toBe(true);
    expect(thrownError?.message).toEqual("`extensionLayerVersion` and `forwarderArn` cannot be set at the same time.");
  });

  it("throws an error when the `extensionLayerVersion` is set and neither the `apiKey` nor `apiKmsKey` is set", () => {
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
    let threwError = false;
    let thrownError: Error | undefined;
    try {
      const datadogCdk = new Datadog(stack, "Datadog", {
        nodeLayerVersion: NODE_LAYER_VERSION,
        extensionLayerVersion: EXTENSION_LAYER_VERSION,
        addLayers: true,
        enableDatadogTracing: false,
        flushMetricsToLogs: true,
        site: "datadoghq.com",
      });
      datadogCdk.addLambdaFunctions([hello]);
    } catch (e) {
      threwError = true;
      thrownError = e;
    }
    expect(threwError).toBe(true);
    expect(thrownError?.message).toEqual("When `extensionLayer` is set, `apiKey` or `apiKmsKey` must also be set.");
  });
});
