import * as crypto from "crypto";
import { ABSENT } from "@aws-cdk/assert/lib/assertions/have-resource";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import "@aws-cdk/assert/jest";
import { Datadog } from "../src/index";
import {
  applyLayers,
  DD_ACCOUNT_ID,
  DD_GOV_ACCOUNT_ID,
  getMissingLayerVersionErrorMsg,
  generateLambdaLayerId,
  generateExtensionLayerId,
} from "../src/layer";
const NODE_LAYER_VERSION = 1;
const PYTHON_LAYER_VERSION = 2;
const EXTENSION_LAYER_VERSION = 5;

describe("applyLayers", () => {
  it("adds a layer", () => {
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
    const errors = applyLayers(stack, stack.region, [hello], PYTHON_LAYER_VERSION, NODE_LAYER_VERSION);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [`arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node10-x:${NODE_LAYER_VERSION}`],
    });
    expect(errors.length).toEqual(0);
  });

  it("adds an extension layer along with a node layer while using an apiKey", () => {
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
    const datadogCdk = new Datadog(stack, "Datadog", {
      nodeLayerVersion: NODE_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKey: "1234",
      addLayers: true,
      enableDDTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node10-x:${NODE_LAYER_VERSION}`,
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Extension:${EXTENSION_LAYER_VERSION}`,
      ],
    });
  });

  it("adds an extension layer along with a python layer while using an apiKMSKey", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCdk = new Datadog(stack, "Datadog", {
      pythonLayerVersion: PYTHON_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKMSKey: "1234",
      addLayers: true,
      enableDDTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Python37:${PYTHON_LAYER_VERSION}`,
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Extension:${EXTENSION_LAYER_VERSION}`,
      ],
    });
  });

  it("works with multiple lambda functions", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello1 = new lambda.Function(stack, "HelloHandler1", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const hello2 = new lambda.Function(stack, "HelloHandler2", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const errors = applyLayers(stack, stack.region, [hello1, hello2], PYTHON_LAYER_VERSION, NODE_LAYER_VERSION);

    expect(errors.length).toEqual(0);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [`arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node10-x:${NODE_LAYER_VERSION}`],
    });
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [`arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node12-x:${NODE_LAYER_VERSION}`],
    });
  });

  it("doesn't add layer when runtime is not supported", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.GO_1_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const errors = applyLayers(stack, stack.region, [hello], PYTHON_LAYER_VERSION, NODE_LAYER_VERSION);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: ABSENT,
    });
    expect(errors.length).toEqual(0);
  });

  it("returns errors if layer versions are not provided for corresponding Lambda runtimes", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello1 = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const hello2 = new lambda.Function(stack, "PythonHandler", {
      runtime: lambda.Runtime.PYTHON_3_6,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const errors = applyLayers(stack, stack.region, [hello1, hello2]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: ABSENT,
    });
    expect(errors).toEqual([
      getMissingLayerVersionErrorMsg("NodeHandler", "Node.js", "node"),
      getMissingLayerVersionErrorMsg("PythonHandler", "Python", "python"),
    ]);
  });
});

describe("isGovCloud", () => {
  it("applies the GovCloud layer", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-gov-east-1",
      },
    });
    const pythonLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const nodeLambda = new lambda.Function(stack, "PythonHandler", {
      // note: not working for python 3.8
      runtime: lambda.Runtime.PYTHON_3_6,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const errors = applyLayers(
      stack,
      stack.region,
      [pythonLambda, nodeLambda],
      PYTHON_LAYER_VERSION,
      NODE_LAYER_VERSION,
    );

    expect(errors.length).toEqual(0);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Python36:${PYTHON_LAYER_VERSION}`,
      ],
    });
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [`arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Node10-x:${NODE_LAYER_VERSION}`],
    });
  });

  it("adds a GovCloud extension layer along with a GovCloud node layer ", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-gov-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCdk = new Datadog(stack, "Datadog", {
      nodeLayerVersion: NODE_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKey: "1234",
      addLayers: true,
      enableDDTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Node10-x:${NODE_LAYER_VERSION}`,
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Extension:${EXTENSION_LAYER_VERSION}`,
      ],
    });
  });

  it("adds a GovCloud extension layer along with a GovCloud python layer ", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-gov-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCdk = new Datadog(stack, "Datadog", {
      pythonLayerVersion: PYTHON_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKey: "1234",
      addLayers: true,
      enableDDTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Python37:${PYTHON_LAYER_VERSION}`,
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Extension:${EXTENSION_LAYER_VERSION}`,
      ],
    });
  });
});

describe("generateLambdaLayerId", () => {
  it("generates a lambda ID consisting of the prefix, runtime, and hash value delimited by hyphens", () => {
    const lambdaFunctionArn = "functionArn";
    const runtime = "python";
    const lambdaLayerId: string = generateLambdaLayerId(lambdaFunctionArn, runtime);
    const layerValue: string = crypto.createHash("sha256").update(lambdaFunctionArn).digest("hex");
    expect(lambdaLayerId).toEqual(`DatadogLayer-python-${layerValue}`);
  });
});

describe("generateExtensionLayerId", () => {
  it("generates an extension ID consisting of the prefix and hash value delimited by hyphens", () => {
    const lambdaFunctionArn = "functionArn";
    const lambdaLayerId: string = generateExtensionLayerId(lambdaFunctionArn);
    const layerValue: string = crypto.createHash("sha256").update(lambdaFunctionArn).digest("hex");
    expect(lambdaLayerId).toEqual(`DatadogExtension-${layerValue}`);
  });
});
