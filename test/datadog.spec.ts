import { App, Stack } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Datadog } from "../src/index";
const { ISecret } = require("aws-cdk-lib/aws-secretsmanager");
const EXTENSION_LAYER_VERSION = 5;
const NODE_LAYER_VERSION = 91;

// Ensures the legacy Datadog class still works
describe("apiKeySecret", () => {
  it("sets apiKeySecretArn", () => {
    const app = new App();
    const stack = new Stack(app, "stack");
    const hello = new lambda.Function(stack, "HelloHandler", {
      runtime: lambda.Runtime.NODEJS_16_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const secret: typeof ISecret = {
      secretArn: "dummy-arn",
      grantRead() {
        return;
      },
    };
    const datadog = new Datadog(stack, "Datadog", {
      nodeLayerVersion: NODE_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      apiKeySecret: secret,
      enableDatadogTracing: false,
      flushMetricsToLogs: false,
    });
    datadog.addLambdaFunctions([hello]);
    expect(datadog.transport.apiKeySecretArn).toEqual("dummy-arn");
  });
});
