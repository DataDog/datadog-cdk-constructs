import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import "@aws-cdk/assert/jest";
import {
  redirectHandlers,
  JS_HANDLER_WITH_LAYERS,
  JS_HANDLER,
  PYTHON_HANDLER,
  DD_HANDLER_ENV_VAR,
} from "../src/redirect";

describe("redirectHandlers", () => {
  it("redirects js handler correctly when addLayers is true", () => {
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
    redirectHandlers([hello], true);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Handler: `${JS_HANDLER_WITH_LAYERS}`,
    });
  });

  it("redirects js handlers correctly when addLayers is false", () => {
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
    redirectHandlers([hello], false);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Handler: `${JS_HANDLER}`,
    });
  });

  it("redirects handler and sets env variable to original handler", () => {
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
    redirectHandlers([hello], true);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Handler: `${PYTHON_HANDLER}`,
    });
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
        },
      },
    });
  });
});
