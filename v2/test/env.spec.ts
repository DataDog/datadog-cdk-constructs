import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  Datadog,
  DefaultDatadogProps,
  transportDefaults,
  ENABLE_DD_TRACING_ENV_VAR,
  INJECT_LOG_CONTEXT_ENV_VAR,
  FLUSH_METRICS_TO_LOGS_ENV_VAR,
  LOG_LEVEL_ENV_VAR,
  ENABLE_DD_LOGS_ENV_VAR,
  CAPTURE_LAMBDA_PAYLOAD_ENV_VAR,
  DD_HANDLER_ENV_VAR,
  DD_TAGS,
} from "../src/index";

describe("applyEnvVariables", () => {
  it("applies default values correctly", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
    });
    datadogCDK.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: transportDefaults.flushMetricsToLogs.toString(),
          [ENABLE_DD_TRACING_ENV_VAR]: DefaultDatadogProps.enableDatadogTracing.toString(),
          [ENABLE_DD_LOGS_ENV_VAR]: DefaultDatadogProps.enableDatadogLogs.toString(),
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: DefaultDatadogProps.captureLambdaPayload.toString(),
          [INJECT_LOG_CONTEXT_ENV_VAR]: DefaultDatadogProps.injectLogContext.toString(),
        },
      },
    });
  });

  it("gives all environment variables the correct names", () => {
    const EXAMPLE_LOG_LEVEL = "debug";
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
      logLevel: EXAMPLE_LOG_LEVEL,
    });
    datadogCDK.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          ["DD_LAMBDA_HANDLER"]: "hello.handler",
          ["DD_FLUSH_TO_LOG"]: transportDefaults.flushMetricsToLogs.toString(),
          ["DD_TRACE_ENABLED"]: DefaultDatadogProps.enableDatadogTracing.toString(),
          ["DD_SERVERLESS_LOGS_ENABLED"]: DefaultDatadogProps.enableDatadogLogs.toString(),
          ["DD_CAPTURE_LAMBDA_PAYLOAD"]: DefaultDatadogProps.captureLambdaPayload.toString(),
          ["DD_LOGS_INJECTION"]: DefaultDatadogProps.injectLogContext.toString(),
          ["DD_LOG_LEVEL"]: EXAMPLE_LOG_LEVEL,
        },
      },
    });
  });
});

describe("ENABLE_DD_TRACING_ENV_VAR", () => {
  it("disables Datadog tracing when set to false", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      enableDatadogTracing: false,
    });
    datadogCDK.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "false",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
      },
    });
  });

  it("enables Datadog tracing by default if value is undefined", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {});
    datadogCDK.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
      },
    });
  });
});

describe("INJECT_LOG_CONTEXT_ENV_VAR", () => {
  it("disables log injection when set to false", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
      injectLogContext: false,
    });
    datadogCDK.addLambdaFunctions([hello]);

    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "false",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
      },
    });
  });

  it("enables log injection by default if value is undefined", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
    });
    datadogCDK.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
      },
    });
  });
});

describe("LOG_LEVEL_ENV_VAR", () => {
  it("sets the log level", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
      logLevel: "debug",
    });
    datadogCDK.addLambdaFunctions([hello]);

    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [LOG_LEVEL_ENV_VAR]: "debug",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
      },
    });
  });
});

describe("ENABLE_DD_LOGS_ENV_VAR", () => {
  it("disables Datadog logs when set to false", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      enableDatadogLogs: false,
    });
    datadogCDK.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "false",
        },
      },
    });
  });

  it("enables Datadog logs by default if value is undefined", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {});
    datadogCDK.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
      },
    });
  });
});

describe("DD_TAGS_ENV_VAR", () => {
  it("sets git.commit.sha in DD_TAGS when addGitCommitMetadata is called", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      captureLambdaPayload: true,
    });
    datadogCDK.addLambdaFunctions([hello]);
    datadogCDK.addGitCommitMetadata([hello], "1234");
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "true",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [DD_TAGS]: "git.commit.sha:1234",
        },
      },
    });
  });

  it("doesn't overwrite DD_TAGS when addGitCommitMetadata is called", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      captureLambdaPayload: true,
      tags: 'key:value',
      // the below fields are needed or DD_TAGS won't get set
      extensionLayerVersion: 10,
      apiKey: 'test',
    });
    datadogCDK.addLambdaFunctions([hello]);
    datadogCDK.addGitCommitMetadata([hello], "1234");
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "true",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [DD_TAGS]: "key:value,git.commit.sha:1234",
        },
      },
    });
  });
});

describe("CAPTURE_LAMBDA_PAYLOAD_ENV_VAR", () => {
  it("sets captureLambdaPayload to true when specified by the user", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      captureLambdaPayload: true,
    });
    datadogCDK.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "true",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
      },
    });
  });

  it("sets default value to false when variable is undefined", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-west-2",
      },
    });
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      captureLambdaPayload: undefined,
    });
    datadogCDK.addLambdaFunctions([hello]);
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
      },
    });
  });
});
