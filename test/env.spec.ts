import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import "@aws-cdk/assert/jest";
import { Datadog, apiKeyEnvVar, apiKeyKMSEnvVar, siteURLEnvVar, logForwardingEnvVar, defaultEnvVar, logLevelEnvVar, enableDDTracingEnvVar, injectLogContextEnvVar } from "../lib/index";
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
              [siteURLEnvVar]: defaultEnvVar.site,
              [logForwardingEnvVar]: defaultEnvVar.flushMetricsToLogs.toString(),
              [logLevelEnvVar]: defaultEnvVar.logLevel,
              [enableDDTracingEnvVar]: defaultEnvVar.enableDDTracing.toString(),
              [injectLogContextEnvVar]: defaultEnvVar.injectLogContext.toString()
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
        }).toThrowError(/Invalid site URL. Must be either datadoghq.com or datadoghq.eu./);
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
            apiKey: "1234",
            flushMetricsToLogs: false,
          });
        expect(stack).toHaveResource("AWS::Lambda::Function", {
          Environment: {
            Variables: {
              [siteURLEnvVar]: "datadoghq.com",
              [logForwardingEnvVar]: "false",
              [DD_HANDLER_ENV_VAR]: "hello.handler",
              [logLevelEnvVar]: "info",
              [enableDDTracingEnvVar]: "true",
              [injectLogContextEnvVar]: "true",
              [apiKeyEnvVar]: "1234"
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
        }).toThrowError(/Invalid log level. Must be either info or debug./);
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
        }).toThrowError("A forwarderARN of the Datadog forwarder lambda function is required for Datadog Tracing (enabled by default). This can be disabled by setting enableDDTracing: false.");
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

describe("apiKeyEnvVar", () => {
  it("sets a DD_API_KEY environment variable when flushMetricsToLogs is false", () => {
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
          flushMetricsToLogs: false,
          apiKey: "1234"
        });
      expect(stack).toHaveResource("AWS::Lambda::Function", {
        Environment: {
          Variables: {
            [DD_HANDLER_ENV_VAR]: "hello.handler",
            [logLevelEnvVar]: "info",
            [siteURLEnvVar]: "datadoghq.com",
            [logForwardingEnvVar]: "false",
            [enableDDTracingEnvVar]: "true",
            [injectLogContextEnvVar]: "true",
            [apiKeyEnvVar]: "1234"
          }
        },
      });
  });
  it("does not set a DD_API_KEY environment variable when flushMetricsToLogs is true", () => {
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
          apiKey: "1234"
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
  it("throws error if flushMetricsToLogs is false and both API key and KMS API key are defined", () => {
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
              forwarderARN: "forwarder-arn",
              flushMetricsToLogs: false,
              apiKey: "1234",
              apiKMSKey: "5678"
            });
      }).toThrowError("The parameters apiKey and apiKMSKey are mutually exclusive. Please set one or the other but not both if flushMetricsToLogs is set to false.");
  });
  it("throws error if flushMetricsToLogs is false and both API key and KMS API key are not defined", () => {
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
            forwarderARN: "forwarder-arn",
            flushMetricsToLogs: false,
          });
    }).toThrowError("The parameters apiKey and apiKMSKey are mutually exclusive. Please set one or the other but not both if flushMetricsToLogs is set to false.");
  });
});

describe("apiKMSKeyEnvVar", () => {
  it("sets an DD_KMS_API_KEY environment variable when flushMetricsToLogs is false", () => {
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
          flushMetricsToLogs: false,
          apiKMSKey: "5678"
        });
      expect(stack).toHaveResource("AWS::Lambda::Function", {
        Environment: {
          Variables: {
            [DD_HANDLER_ENV_VAR]: "hello.handler",
            [logLevelEnvVar]: "info",
            [siteURLEnvVar]: "datadoghq.com",
            [logForwardingEnvVar]: "false",
            [enableDDTracingEnvVar]: "true",
            [injectLogContextEnvVar]: "true",
            [apiKeyKMSEnvVar]: "5678"
          }
        },
      });
  });
  it("does not set DD_KMS_API_KEY environment variable when flushMetricsToLogs is true", () => {
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
          apiKMSKey: "5678"
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
