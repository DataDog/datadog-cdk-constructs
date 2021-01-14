import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import "@aws-cdk/assert/jest";
import { Datadog } from "../lib/index";
import { siteURLEnvVar, logForwardingEnvVar } from "../lib/environment";
import { DD_HANDLER_ENV_VAR } from "../lib/redirect";

describe("siteURLEnvVar", () => {
    it("applies site URL parameter correctly", () => {
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
        site: "datadoghq.eu"
      });
      expect(stack).toHaveResource("AWS::Lambda::Function", {
        Environment: {
          Variables: {
            [siteURLEnvVar]: "datadoghq.eu",
            [logForwardingEnvVar]: "true",
            [DD_HANDLER_ENV_VAR]: "hello.handler"
          },
        },
      });
    });
    it("applies default site URL parameter if undefined", () => {
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
        });
        expect(stack).toHaveResource("AWS::Lambda::Function", {
          Environment: {
            Variables: {
              [siteURLEnvVar]: "datadoghq.com",
              [logForwardingEnvVar]: "true",
              [DD_HANDLER_ENV_VAR]: "hello.handler"
            },
          },
        });
      });
      it("applies URL parameter for multiple lambdas", () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, "stack", {
          env: {
            region: "us-west-2",
          },
        });
        const hello1 = new lambda.Function(stack, "HelloHandler", {
          runtime: lambda.Runtime.NODEJS_10_X,
          code: lambda.Code.fromInline("test"),
          handler: "hello.handler",
        });
        const hello2 = new lambda.Function(stack, "HelloHandler2", {
            runtime: lambda.Runtime.NODEJS_12_X,
            code: lambda.Code.inline("test"),
            handler: "hello.handler",
          });
        new Datadog(stack, "Datadog", {
          lambdaFunctions: [hello1, hello2],
        });
        expect(stack).toHaveResource("AWS::Lambda::Function", {
          Environment: {
            Variables: {
              [siteURLEnvVar]: "datadoghq.com",
              [logForwardingEnvVar]: "true",
              [DD_HANDLER_ENV_VAR]: "hello.handler"
            },
          },
        });
      });
      it("throws error if invalid site", () => {
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
            new Datadog(stack, "Datadog", {
                lambdaFunctions: [hello],
                site: "123.com"
              });
        }
      ).toThrowError(/Site URL must be either datadoghq.com or datadoghq.eu/);
    });
});

describe("logForwardingEnvVar", () => {
    it("applies log forwarding parameter correctly", () => {
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
            flushMetricsToLogs: false
          });
          expect(stack).toHaveResource("AWS::Lambda::Function", {
            Environment: {
              Variables: {
                [siteURLEnvVar]: "datadoghq.com",
                [logForwardingEnvVar]: "false",
                [DD_HANDLER_ENV_VAR]: "hello.handler"
              },
            },
          });
        });
});
