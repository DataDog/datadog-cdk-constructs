import * as cdk from "@aws-cdk/core";
import "@aws-cdk/assert/jest";
import * as lambda from "@aws-cdk/aws-lambda";
import {
  applyLayers,
  DD_ACCOUNT_ID,
  DD_GOV_ACCOUNT_ID,
  getMissingLayerVersionErrorMsg,
} from "../lib/layer";
import { ABSENT } from "@aws-cdk/assert/lib/assertions/have-resource";
const nodeLayerVersion = 1;
const pythonLayerVersion = 2;

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
    const errors = applyLayers(
      stack,
      stack.region,
      [hello],
      pythonLayerVersion,
      nodeLayerVersion,
    );
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node10-x:${nodeLayerVersion}`,
      ],
    });
    expect(errors.length).toEqual(0);
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
    const errors = applyLayers(
      stack,
      stack.region,
      [hello1, hello2],
      pythonLayerVersion,
      nodeLayerVersion,
    );

    expect(errors.length).toEqual(0);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node10-x:${nodeLayerVersion}`,
      ],
    });
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [
        `arn:aws:lambda:${stack.region}:${DD_ACCOUNT_ID}:layer:Datadog-Node12-x:${nodeLayerVersion}`,
      ],
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
    const errors = applyLayers(
      stack,
      stack.region,
      [hello],
      pythonLayerVersion,
      nodeLayerVersion,
    );
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
      pythonLayerVersion,
      nodeLayerVersion,
    );

    expect(errors.length).toEqual(0);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Python36:${pythonLayerVersion}`,
      ],
    });
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Layers: [
        `arn:aws-us-gov:lambda:us-gov-east-1:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Node10-x:${nodeLayerVersion}`,
      ],
    });
  });
});
