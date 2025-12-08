import { App, Stack } from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  redirectHandlers,
  JS_HANDLER_WITH_LAYERS,
  JS_HANDLER,
  PYTHON_HANDLER,
  DD_HANDLER_ENV_VAR,
  AWS_LAMBDA_EXEC_WRAPPER_ENV_VAR,
  AWS_LAMBDA_EXEC_WRAPPER,
} from "../src/index";

describe("redirectHandlers", () => {
  it("redirects NODEJS handler correctly when addLayers is true", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    redirectHandlers(hello, true, true);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Handler: `${JS_HANDLER_WITH_LAYERS}`,
    });
  });

  it("redirects NODEJS handlers correctly when addLayers is false", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    redirectHandlers(hello, false, true);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Handler: `${JS_HANDLER}`,
    });
  });

  it("redirects PYTHON handler correctly", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    redirectHandlers(hello, true, true);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Handler: `${PYTHON_HANDLER}`,
    });
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
        },
      },
    });
  });

  it.each([
    ["JAVA", lambda.Runtime.JAVA_21],
    ["DOTNET", lambda.Runtime.DOTNET_8],
  ])("skips redirecting handler for '%s' and sets wrapper env var when extension configured", (_text, runtime) => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: runtime,
      code: lambda.Code.fromAsset(__dirname + "/../integration_tests/lambda"),
      handler: "handleRequest",
    });
    redirectHandlers(hello, true, true);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Handler: "handleRequest",
    });
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [AWS_LAMBDA_EXEC_WRAPPER_ENV_VAR]: AWS_LAMBDA_EXEC_WRAPPER,
        },
      },
    });
  });

  it.each([
    ["JAVA", lambda.Runtime.JAVA_21],
    ["DOTNET", lambda.Runtime.DOTNET_8],
  ])("does not set wrapper env var when extension is not configured", (_text, runtime) => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: runtime,
      code: lambda.Code.fromAsset(__dirname + "/../integration_tests/lambda"),
      handler: "handleRequest",
    });
    redirectHandlers(hello, true, false);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Handler: "handleRequest",
    });
    Template.fromStack(stack).resourcePropertiesCountIs(
      "AWS::Lambda::Function",
      {
        Environment: {
          Variables: {},
        },
      },
      0,
    );
  });

  it("doesn't set env vars for function with unsupported JAVA version", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.JAVA_8,
      code: lambda.Code.fromAsset(__dirname + "/../integration_tests/lambda"),
      handler: "handleRequest",
    });
    redirectHandlers(hello, true, true);
    Template.fromStack(stack).resourcePropertiesCountIs(
      "AWS::Lambda::Function",
      {
        Environment: {
          Variables: {
            [AWS_LAMBDA_EXEC_WRAPPER_ENV_VAR]: AWS_LAMBDA_EXEC_WRAPPER,
          },
        },
      },
      0,
    );
  });

  it("doesn't set handler or runtime for container image functions", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.DockerImageFunction(stack, "HelloHandler", {
      code: lambda.DockerImageCode.fromImageAsset("./test/assets"),
    });
    redirectHandlers(hello, true, true);

    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Handler: Match.absent(),
      Runtime: Match.absent(),
    });
  });
});
