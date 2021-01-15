import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import "@aws-cdk/assert/jest";
import { Datadog } from "../lib/index";
import { siteURLEnvVar, logForwardingEnvVar, defaultEnvVar, logLevelEnvVar, enableDDTracingEnvVar, injectLogContextEnvVar } from "../lib/environment";
import { DD_HANDLER_ENV_VAR } from "../lib/redirect";

describe("applyEnvVariables", () => {
    it("applies default values correctly", () => {
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
            forwarderARN: "forwarder-arn"
          });
        expect(stack).toHaveResource("AWS::Lambda::Function", {
          Environment: {
            Variables: {
              [DD_HANDLER_ENV_VAR]: "hello.handler",
              ...defaultEnvVar
            }
          },
        });
    });
});
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
          forwarderARN: "forwarder-arn",
          site: "datadoghq.eu"
        });
        expect(stack).toHaveResource("AWS::Lambda::Function", {
          Environment: {
            Variables: {
              [siteURLEnvVar]: "datadoghq.eu",
              [logForwardingEnvVar]: "true",
              [DD_HANDLER_ENV_VAR]: "hello.handler",
              [logLevelEnvVar]: "info",
              [enableDDTracingEnvVar]: "true",
              [injectLogContextEnvVar]: "true"
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
          forwarderARN: "forwarder-arn"
        });
        expect(stack).toHaveResource("AWS::Lambda::Function", {
          Environment: {
            Variables: {
              [siteURLEnvVar]: "datadoghq.com",
              [logForwardingEnvVar]: "true",
              [DD_HANDLER_ENV_VAR]: "hello.handler",
              [logLevelEnvVar]: "info",
              [enableDDTracingEnvVar]: "true",
              [injectLogContextEnvVar]: "true"
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
            code: lambda.Code.fromInline("test"),
            handler: "hello.handler",
          });
        new Datadog(stack, "Datadog", {
          lambdaFunctions: [hello1, hello2],
          forwarderARN: "forwarder-arn"
        });
        expect(stack).toHaveResource("AWS::Lambda::Function", {
          Environment: {
            Variables: {
              [siteURLEnvVar]: "datadoghq.com",
              [logForwardingEnvVar]: "true",
              [DD_HANDLER_ENV_VAR]: "hello.handler",
              [logLevelEnvVar]: "info",
              [enableDDTracingEnvVar]: "true",
              [injectLogContextEnvVar]: "true"
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
        }).toThrowError(/Invalid site URL. Must be either datadoghq.com or datadoghq.eu/);
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
            forwarderARN: "forwarder-arn",
            flushMetricsToLogs: false
          });
        expect(stack).toHaveResource("AWS::Lambda::Function", {
          Environment: {
            Variables: {
              [siteURLEnvVar]: "datadoghq.com",
              [logForwardingEnvVar]: "false",
              [DD_HANDLER_ENV_VAR]: "hello.handler",
              [logLevelEnvVar]: "info",
              [enableDDTracingEnvVar]: "true",
              [injectLogContextEnvVar]: "true"
            },
          },
        });
    });
    it("appies default log forwarding value if undefined", () => {
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
            forwarderARN: "forwarder-arn"
          });
          expect(stack).toHaveResource("AWS::Lambda::Function", {
            Environment: {
              Variables: {
                [siteURLEnvVar]: "datadoghq.com",
                [logForwardingEnvVar]: "true",
                [DD_HANDLER_ENV_VAR]: "hello.handler",
                [logLevelEnvVar]: "info",
                [enableDDTracingEnvVar]: "true",
                [injectLogContextEnvVar]: "true"
              },
            },
        });
    });
    // it("throws error if invalid log forwarding value", () => {
    //     const app = new cdk.App();
    //     const stack = new cdk.Stack(app, "stack", {
    //       env: {
    //         region: "us-west-2",
    //       },
    //     });
    //     const hello = new lambda.Function(stack, "HelloHandler", {
    //       runtime: lambda.Runtime.NODEJS_10_X,
    //       code: lambda.Code.fromInline("test"),
    //       handler: "hello.handler",
    //     });
    //     expect(() => {
    //         new Datadog(stack, "Datadog", {
    //             lambdaFunctions: [hello],
    //             flushMetricsToLogs:
    //           });
    //     }).toThrowError(/Log forwarding can only be either true or false/);
    // });

});

describe("logLevelEnvVar", () => {
    it("sets log level to debug correctly", () => {
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
            forwarderARN: "forwarder-arn",
            logLevel: "debug"
          });
          expect(stack).toHaveResource("AWS::Lambda::Function", {
            Environment: {
              Variables: {
                [logLevelEnvVar]: "debug",
                [siteURLEnvVar]: "datadoghq.com",
                [logForwardingEnvVar]: "true",
                [DD_HANDLER_ENV_VAR]: "hello.handler",
                [enableDDTracingEnvVar]: "true",
                [injectLogContextEnvVar]: "true"
              },
            },
        });
    });
    it("applies default log level value if undefined", () => {
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
            forwarderARN: "forwarder-arn"
          });
          expect(stack).toHaveResource("AWS::Lambda::Function", {
            Environment: {
              Variables: {
                [logLevelEnvVar]: "info",
                [siteURLEnvVar]: "datadoghq.com",
                [logForwardingEnvVar]: "true",
                [DD_HANDLER_ENV_VAR]: "hello.handler",
                [enableDDTracingEnvVar]: "true",
                [injectLogContextEnvVar]: "true"
              },
            },
        });
    });
    it("throws error if invalid log level", () => {
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
                logLevel: "high"
              });
        }).toThrowError(/Invalid log level. Must be either info or debug/);
    });
});

describe("enableDDTracingEnvVar", () => {
    it("disables Datadog tracing when set to false", () => {
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
            enableDDTracing: false
          });
        expect(stack).toHaveResource("AWS::Lambda::Function", {
          Environment: {
            Variables: {
              [DD_HANDLER_ENV_VAR]: "hello.handler",
              [logLevelEnvVar]: "info",
              [siteURLEnvVar]: "datadoghq.com",
              [logForwardingEnvVar]: "true",
              [enableDDTracingEnvVar]: "false",
              [injectLogContextEnvVar]: "true"
            }
          },
        });
    });
    it("enables Datadog tracing by default if value is undefined", () => {
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
            forwarderARN: "forwarder-arn"
          });
        expect(stack).toHaveResource("AWS::Lambda::Function", {
          Environment: {
            Variables: {
              [DD_HANDLER_ENV_VAR]: "hello.handler",
              [logLevelEnvVar]: "info",
              [siteURLEnvVar]: "datadoghq.com",
              [logForwardingEnvVar]: "true",
              [enableDDTracingEnvVar]: "true",
              [injectLogContextEnvVar]: "true"
            }
          },
        });
    });
    it("throws error if Datadog Tracing is enabled but forwarder is not defined", () => {
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
              });
        }).toThrowError("A forwarderARN of the Datadog forwarder lambda function is required for Datadog Tracing (enabled by default). This can be disabled by setting enableDDTracing: false");
    });
});

describe("injectLogContextEnvVar", () => {
    it("disables log injection when set to false", () => {
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
            forwarderARN: "forwarder-arn",
            injectLogContext: false
          });
        expect(stack).toHaveResource("AWS::Lambda::Function", {
          Environment: {
            Variables: {
              [DD_HANDLER_ENV_VAR]: "hello.handler",
              [logLevelEnvVar]: "info",
              [siteURLEnvVar]: "datadoghq.com",
              [logForwardingEnvVar]: "true",
              [enableDDTracingEnvVar]: "true",
              [injectLogContextEnvVar]: "false"
            }
          },
        });
    });
    it("enables log injection by default if value is undefined", () => {
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
            forwarderARN: "forwarder-arn"
          });
        expect(stack).toHaveResource("AWS::Lambda::Function", {
          Environment: {
            Variables: {
              [DD_HANDLER_ENV_VAR]: "hello.handler",
              [logLevelEnvVar]: "info",
              [siteURLEnvVar]: "datadoghq.com",
              [logForwardingEnvVar]: "true",
              [enableDDTracingEnvVar]: "true",
              [injectLogContextEnvVar]: "true"
            }
          },
        });
    });
});
