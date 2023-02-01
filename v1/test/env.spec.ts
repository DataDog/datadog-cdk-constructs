import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import "@aws-cdk/assert/jest";
import {
  Datadog,
  ENABLE_DD_TRACING_ENV_VAR,
  INJECT_LOG_CONTEXT_ENV_VAR,
  FLUSH_METRICS_TO_LOGS_ENV_VAR,
  LOG_LEVEL_ENV_VAR,
  ENABLE_DD_LOGS_ENV_VAR,
  CAPTURE_LAMBDA_PAYLOAD_ENV_VAR,
  DD_HANDLER_ENV_VAR,
  ENABLE_XRAY_TRACE_MERGING_ENV_VAR,
  DD_TAGS,
  SITE_URL_ENV_VAR,
  API_KEY_ENV_VAR,
} from "../src/index";

describe("applyEnvVariables", () => {
  it("applies default values correctly", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
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
      forwarderArn: "forwarder-arn",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "false",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
        },
      },
    });
  });

  it("gives all environment variables the correct names", () => {
    const EXAMPLE_LOG_LEVEL = "debug";
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
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
      forwarderArn: "forwarder-arn",
      logLevel: EXAMPLE_LOG_LEVEL,
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          ["DD_LAMBDA_HANDLER"]: "hello.handler",
          ["DD_FLUSH_TO_LOG"]: "true",
          ["DD_TRACE_ENABLED"]: "true",
          ["DD_MERGE_XRAY_TRACES"]: "false",
          ["DD_SERVERLESS_LOGS_ENABLED"]: "true",
          ["DD_CAPTURE_LAMBDA_PAYLOAD"]: "false",
          ["DD_LOGS_INJECTION"]: "true",
          ["DD_LOG_LEVEL"]: "debug",
        },
      },
    });
  });
});

describe("ENABLE_DD_TRACING_ENV_VAR", () => {
  it("disables Datadog tracing when set to false", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
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
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "false",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "false",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
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
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {});
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "false",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
      },
    });
  });
});

describe("ENABLE_XRAY_TRACE_MERGING_ENV_VAR", () => {
  it("enables Datadog xray trace merging when set to true", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
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
      enableMergeXrayTraces: true,
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
      },
    });
  });

  it("disables Datadog xray trace merging by default if value is undefined", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
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
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "false",
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
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
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
      forwarderArn: "forwarder-arn",
      injectLogContext: false,
    });
    datadogCDK.addLambdaFunctions([hello]);

    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "false",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "false",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
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
      runtime: lambda.Runtime.NODEJS_12_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const datadogCDK = new Datadog(stack, "Datadog", {
      forwarderArn: "forwarder-arn",
    });
    datadogCDK.addLambdaFunctions([hello]);
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "false",
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
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
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
      forwarderArn: "forwarder-arn",
      logLevel: "debug",
    });
    datadogCDK.addLambdaFunctions([hello]);

    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "false",
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
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
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
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "false",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "false",
        },
      },
    });
  });

  it("enables Datadog logs by default if value is undefined", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
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
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "false",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
      },
    });
  });
});

describe("DD_TAGS_ENV_VAR", () => {
  it("sets git.commit.sha and git.repository_url in DD_TAGS when addGitCommitMetadata is called", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
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
    datadogCDK.addGitCommitMetadata([hello], "1234", "5432");
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "true",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [DD_TAGS]: "git.commit.sha:1234,git.repository_url:5432",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "false",
        },
      },
    });
  });

  it("doesn't overwrite DD_TAGS when addGitCommitMetadata is called", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
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
      tags: "key:value",
      // the below fields are needed or DD_TAGS won't get set
      extensionLayerVersion: 10,
      apiKey: "test",
    });
    datadogCDK.addLambdaFunctions([hello]);
    datadogCDK.addGitCommitMetadata([hello], "1234", "5432");
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "false",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "true",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
          [DD_TAGS]: "key:value,git.commit.sha:1234,git.repository_url:5432",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "false",
          [SITE_URL_ENV_VAR]: "datadoghq.com",
          [API_KEY_ENV_VAR]: "test",
        },
      },
    });
  });
});

describe("CAPTURE_LAMBDA_PAYLOAD_ENV_VAR", () => {
  it("sets captureLambdaPayload to true when specified by the user", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
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
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "false",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "true",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
      },
    });
  });

  it("sets default value to false when variable is undefined", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
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
    expect(stack).toHaveResource("AWS::Lambda::Function", {
      Environment: {
        Variables: {
          [DD_HANDLER_ENV_VAR]: "hello.handler",
          [FLUSH_METRICS_TO_LOGS_ENV_VAR]: "true",
          [ENABLE_DD_TRACING_ENV_VAR]: "true",
          [ENABLE_XRAY_TRACE_MERGING_ENV_VAR]: "false",
          [CAPTURE_LAMBDA_PAYLOAD_ENV_VAR]: "false",
          [INJECT_LOG_CONTEXT_ENV_VAR]: "true",
          [ENABLE_DD_LOGS_ENV_VAR]: "true",
        },
      },
    });
  });
});
