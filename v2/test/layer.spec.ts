import * as crypto from "crypto";
import { App, Stack } from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Architecture } from "aws-cdk-lib/aws-lambda";
import log from "loglevel";
import {
  Datadog,
  applyLayers,
  DD_ACCOUNT_ID,
  DD_GOV_ACCOUNT_ID,
  getMissingLayerVersionErrorMsg,
  generateLambdaLayerId,
  generateExtensionLayerId,
} from "../src/index";
const NODE_LAYER_VERSION = 91;
const PYTHON_LAYER_VERSION = 73;
const EXTENSION_LAYER_VERSION = 5;

describe("applyLayers", () => {
  it("adds a layer", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
    });
    const errors = applyLayers(stack, stack.region, [hello], PYTHON_LAYER_VERSION, NODE_LAYER_VERSION);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [`arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node12-x:${NODE_LAYER_VERSION}`],
    });
    expect(errors.length).toEqual(0);
  });

  it("adds an extension layer along with a node layer while using an apiKey", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
    });
    const datadogCdk = new Datadog(stack, "Datadog", {
      nodeLayerVersion: NODE_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKey: "1234",
      addLayers: true,
      enableDatadogTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node12-x:${NODE_LAYER_VERSION}`,
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Extension:${EXTENSION_LAYER_VERSION}`,
      ],
    });
  });

  it("adds adds the ARM suffix to only the Extension layer", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
      architecture: Architecture.ARM_64,
    });

    const datadogCdk = new Datadog(stack, "Datadog", {
      nodeLayerVersion: NODE_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKey: "1234",
      addLayers: true,
      enableDatadogTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node12-x:${NODE_LAYER_VERSION}`,
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Extension-ARM:${EXTENSION_LAYER_VERSION}`,
      ],
    });
  });

  it("adds an extension layer along with a python layer while using an apiKmsKey", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
    });
    const datadogCdk = new Datadog(stack, "Datadog", {
      pythonLayerVersion: PYTHON_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKmsKey: "1234",
      addLayers: true,
      enableDatadogTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Python37:${PYTHON_LAYER_VERSION}`,
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Extension:${EXTENSION_LAYER_VERSION}`,
      ],
    });
  });

  it("adds the ARM suffix to the Python and Extension layers", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
      architecture: Architecture.ARM_64,
    });
    const datadogCdk = new Datadog(stack, "Datadog", {
      pythonLayerVersion: PYTHON_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKmsKey: "1234",
      addLayers: true,
      enableDatadogTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Python37-ARM:${PYTHON_LAYER_VERSION}`,
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Extension-ARM:${EXTENSION_LAYER_VERSION}`,
      ],
    });
  });

  it("adds layer when architecture property is missing", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
    });
    (hello as any).architecture = undefined;
    const errors = applyLayers(stack, stack.region, [hello], PYTHON_LAYER_VERSION, NODE_LAYER_VERSION);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [`arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node12-x:${NODE_LAYER_VERSION}`],
    });
    expect(errors.length).toEqual(0);
  });

  it("works with multiple lambda functions", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello1 = new lambda.Function(stack, "HelloHandler1", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
    });
    const hello2 = new lambda.Function(stack, "HelloHandler2", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
    });
    const hello3 = new lambda.Function(stack, "HelloHandler3", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
    });

    const errors = applyLayers(stack, stack.region, [hello1, hello2, hello3], PYTHON_LAYER_VERSION, NODE_LAYER_VERSION);

    expect(errors.length).toEqual(0);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [`arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node12-x:${NODE_LAYER_VERSION}`],
    });
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [`arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node14-x:${NODE_LAYER_VERSION}`],
    });
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [`arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node16-x:${NODE_LAYER_VERSION}`],
    });
  });

  it("doesn't add layer when runtime is not supported", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
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
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: Match.absent(),
    });
    expect(errors.length).toEqual(0);
  });

  it("doesn't add layer to container image Lambda without extension or layer versions", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.DockerImageFunction(stack, "HelloHandler", {
      functionName: "container-lambda",
      code: lambda.DockerImageCode.fromImageAsset("./test/assets"),
    });
    const datadogCdk = new Datadog(stack, "Datadog", {
      apiKmsKey: "1234",
      addLayers: true,
      enableDatadogTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: Match.absent(),
      Runtime: Match.absent(),
      Handler: Match.absent(),
    });
  });

  it("doesn't add layer to container image Lambda with extension and layer versions", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.DockerImageFunction(stack, "HelloHandler", {
      functionName: "container-lambda",
      code: lambda.DockerImageCode.fromImageAsset("./test/assets"),
    });

    const datadogCdk = new Datadog(stack, "Datadog", {
      pythonLayerVersion: PYTHON_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKmsKey: "1234",
      addLayers: true,
      enableDatadogTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([hello]);

    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: Match.absent(),
      Runtime: Match.absent(),
      Handler: Match.absent(),
    });
  });

  it("returns errors if layer versions are not provided for corresponding Lambda runtimes", () => {
    const logSpy = jest.spyOn(log, "error").mockImplementation(() => ({}));
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello1 = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const hello2 = new lambda.Function(stack, "PythonHandler", {
      runtime: lambda.Runtime.PYTHON_3_6,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
    });
    const errors = applyLayers(stack, stack.region, [hello1, hello2]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: Match.absent(),
    });
    expect(errors).toEqual([
      getMissingLayerVersionErrorMsg("NodeHandler", "Node.js", "node"),
      getMissingLayerVersionErrorMsg("PythonHandler", "Python", "python"),
    ]);
    expect(logSpy).toHaveBeenCalledTimes(2);
    logSpy.mockRestore();
  });
});

describe("isGovCloud", () => {
  it("applies the GovCloud layer", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-gov-east-1",
      },
    });
    const pythonLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const nodeLambda = new lambda.Function(stack, "PythonHandler", {
      // note: not working for python 3.8
      runtime: lambda.Runtime.PYTHON_3_6,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
    });
    const errors = applyLayers(
      stack,
      stack.region,
      [pythonLambda, nodeLambda],
      PYTHON_LAYER_VERSION,
      NODE_LAYER_VERSION,
    );

    expect(errors.length).toEqual(0);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Python36:${PYTHON_LAYER_VERSION}`,
      ],
    });
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [`arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Node12-x:${NODE_LAYER_VERSION}`],
    });
  });

  it("adds a GovCloud extension layer along with a GovCloud node layer ", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-gov-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
    });
    const datadogCdk = new Datadog(stack, "Datadog", {
      nodeLayerVersion: NODE_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKey: "1234",
      addLayers: true,
      enableDatadogTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Node12-x:${NODE_LAYER_VERSION}`,
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Extension:${EXTENSION_LAYER_VERSION}`,
      ],
    });
  });

  it("adds a GovCloud extension layer along with a GovCloud python layer ", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-gov-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
    });
    const datadogCdk = new Datadog(stack, "Datadog", {
      pythonLayerVersion: PYTHON_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKey: "1234",
      addLayers: true,
      enableDatadogTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Python37:${PYTHON_LAYER_VERSION}`,
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Extension:${EXTENSION_LAYER_VERSION}`,
      ],
    });
  });

  it("adds a the ARM suffix to the layer", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-gov-east-1",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("test/lambda"),
      handler: "example-lambda.handler",
      architecture: Architecture.ARM_64,
    });
    const datadogCdk = new Datadog(stack, "Datadog", {
      pythonLayerVersion: PYTHON_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKey: "1234",
      addLayers: true,
      enableDatadogTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    });
    datadogCdk.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Layers: [
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Python37-ARM:${PYTHON_LAYER_VERSION}`,
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Extension-ARM:${EXTENSION_LAYER_VERSION}`,
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
