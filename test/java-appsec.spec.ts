import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { DatadogAppSecMode, DatadogLambda, DatadogLambdaProps } from "../src";

jest.mock("child_process", () => ({ execSync: () => "1234" }));

function setup(props: DatadogLambdaProps = {}, runtime = lambda.Runtime.JAVA_21) {
  const stack = new Stack(new App(), "Stack", { env: { region: "us-east-1" } });
  const fn = new lambda.Function(stack, "Function", {
    runtime,
    handler: "example.Handler::handleRequest",
    code: lambda.Code.fromAsset(__dirname + "/../integration_tests/lambda"),
  });
  const datadog = new DatadogLambda(stack, "Datadog", {
    apiKey: "test",
    sourceCodeIntegration: false,
    datadogAppSecMode: DatadogAppSecMode.ON,
    javaLayerVersion: 31,
    extensionLayerVersion: 102,
    ...props,
  });
  return { stack, fn, datadog };
}

function variables(stack: Stack) {
  const resources = Template.fromStack(stack).findResources("AWS::Lambda::Function");
  return Object.values(resources)[0].Properties.Environment.Variables;
}

function expectMode(stack: Stack, tracer: boolean) {
  const env = variables(stack);
  expect(env.DD_APPSEC_ENABLED).toBe(tracer ? "true" : undefined);
  expect(env).toMatchObject({
    DD_SERVERLESS_APPSEC_ENABLED: String(!tracer),
    AWS_LAMBDA_EXEC_WRAPPER: "/opt/datadog_wrapper",
  });
}

describe("Java AppSec version selection", () => {
  it.each([
    [30, 101, false],
    [30, 102, false],
    [31, 101, false],
    [31, 102, true],
    [32, 103, true],
  ])("ON with Java %i and extension %i selects tracer=%s", (javaLayerVersion, extensionLayerVersion, tracer) => {
    const { stack, fn, datadog } = setup({ javaLayerVersion, extensionLayerVersion });
    datadog.addLambdaFunctions([fn]);
    expectMode(stack, tracer);
  });

  it("falls back when javaLayerVersion is omitted", () => {
    const { stack, fn, datadog } = setup({ javaLayerVersion: undefined });
    datadog.addLambdaFunctions([fn]);
    expectMode(stack, false);
  });

  const unverified: DatadogLambdaProps[] = [
    { javaLayerVersion: 30 },
    { extensionLayerVersion: 101 },
    { javaLayerVersion: undefined, javaLayerArn: "arn:aws:lambda:us-east-1:464622532012:layer:dd-trace-java:31" },
    {
      extensionLayerVersion: undefined,
      extensionLayerArn: "arn:aws:lambda:us-east-1:464622532012:layer:Datadog-Extension:102",
    },
  ];

  it.each(unverified)("ON falls back for missing or unsupported versions: %j", (props) => {
    const { stack, fn, datadog } = setup(props);
    datadog.addLambdaFunctions([fn]);
    expectMode(stack, false);
  });

  it.each(unverified)("TRACER forces enablement without version detection: %j", (props) => {
    const { stack, fn, datadog } = setup({ ...props, datadogAppSecMode: DatadogAppSecMode.TRACER });
    datadog.addLambdaFunctions([fn]);
    expectMode(stack, true);
  });

  it("keeps the extension wrapper when handler redirection is disabled", () => {
    const { stack, fn, datadog } = setup({ javaLayerVersion: 30, redirectHandler: false });
    datadog.addLambdaFunctions([fn]);
    expectMode(stack, false);
  });

  it("TRACER accepts compatible versions", () => {
    const { stack, fn, datadog } = setup({ datadogAppSecMode: DatadogAppSecMode.TRACER });
    datadog.addLambdaFunctions([fn]);
    expectMode(stack, true);
  });

  it.each([
    { datadogAppSecMode: DatadogAppSecMode.EXTENSION },
    { datadogAppSecMode: undefined, enableDatadogASM: true },
  ])("preserves explicit and deprecated extension selection: %j", (props) => {
    const { stack, fn, datadog } = setup(props);
    datadog.addLambdaFunctions([fn]);
    expectMode(stack, false);
  });

  it("OFF preserves manually configured AppSec flags", () => {
    const { stack, fn, datadog } = setup({ datadogAppSecMode: DatadogAppSecMode.OFF });
    fn.addEnvironment("DD_SERVERLESS_APPSEC_ENABLED", "true");
    datadog.addLambdaFunctions([fn]);
    expect(variables(stack).DD_SERVERLESS_APPSEC_ENABLED).toBe("true");
    expect(variables(stack).DD_APPSEC_ENABLED).toBeUndefined();
  });

  it("clears a previously configured extension flag when enabling the tracer", () => {
    const { stack, fn, datadog } = setup();
    fn.addEnvironment("DD_SERVERLESS_APPSEC_ENABLED", "true");
    datadog.addLambdaFunctions([fn]);
    expectMode(stack, true);
  });

  it.each([DatadogAppSecMode.ON, DatadogAppSecMode.TRACER])(
    "%s preserves explicit legacy configuration",
    (datadogAppSecMode) => {
      const { stack, fn, datadog } = setup({ datadogAppSecMode });
      datadog.setEnvironment(fn, "DD_APPSEC_ENABLED", "false");
      datadog.setEnvironment(fn, "DD_SERVERLESS_APPSEC_ENABLED", "true");
      datadog.addLambdaFunctions([fn]);
      expect(variables(stack)).toMatchObject({
        DD_APPSEC_ENABLED: "false",
        DD_SERVERLESS_APPSEC_ENABLED: "true",
        AWS_LAMBDA_EXEC_WRAPPER: "/opt/datadog_wrapper",
      });
    },
  );

  it.each(["true", "TRUE", "1", "t"])("preserves explicit extension enablement %s", (value) => {
    const { stack, fn, datadog } = setup();
    datadog.setEnvironment(fn, "DD_SERVERLESS_APPSEC_ENABLED", value);
    datadog.addLambdaFunctions([fn]);
    expect(variables(stack).DD_SERVERLESS_APPSEC_ENABLED).toBe(value);
    expect(variables(stack).DD_APPSEC_ENABLED).toBeUndefined();
  });

  it.each([DatadogAppSecMode.ON, DatadogAppSecMode.TRACER])(
    "%s loads the Java tracer when handler redirection is disabled",
    (datadogAppSecMode) => {
      const { stack, fn, datadog } = setup({ datadogAppSecMode, redirectHandler: false });
      datadog.addLambdaFunctions([fn]);
      expectMode(stack, true);
    },
  );

  it("preserves a tracked custom wrapper when handler redirection is disabled", () => {
    const { stack, fn, datadog } = setup({ redirectHandler: false });
    datadog.setEnvironment(fn, "AWS_LAMBDA_EXEC_WRAPPER", "/opt/custom-wrapper");
    datadog.addLambdaFunctions([fn]);
    expect(variables(stack).AWS_LAMBDA_EXEC_WRAPPER).toBe("/opt/custom-wrapper");
  });

  it("preserves legacy extension flag precedence without errors", () => {
    const { stack, fn, datadog } = setup({ datadogAppSecMode: undefined, enableDatadogASM: true });
    datadog.setEnvironment(fn, "DD_APPSEC_ENABLED", "true");
    datadog.addLambdaFunctions([fn]);
    expect(variables(stack)).toMatchObject({ DD_APPSEC_ENABLED: "true", DD_SERVERLESS_APPSEC_ENABLED: "true" });
  });

  it("selects modes per runtime in a mixed stack", () => {
    const { stack, fn, datadog } = setup({ pythonLayerVersion: 114 });
    const python = new lambda.Function(stack, "Python", {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "index.handler",
      code: lambda.Code.fromInline("test"),
    });
    const node = new lambda.Function(stack, "Node", {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: "index.handler",
      code: lambda.Code.fromInline("test"),
    });
    datadog.addLambdaFunctions([fn, python, node]);
    const functions = Object.values(Template.fromStack(stack).findResources("AWS::Lambda::Function"));
    for (const resource of functions) {
      const env = resource.Properties.Environment.Variables;
      if (resource.Properties.Runtime === "java21") {
        expect(env.DD_APPSEC_ENABLED).toBe("true");
        expect(env.DD_SERVERLESS_APPSEC_ENABLED).toBe("false");
      } else if (resource.Properties.Runtime === "python3.12") {
        expect(env.DD_APPSEC_ENABLED).toBe("true");
        expect(env.DD_SERVERLESS_APPSEC_ENABLED).toBeUndefined();
      } else {
        expect(env.DD_SERVERLESS_APPSEC_ENABLED).toBe("true");
        expect(env.DD_APPSEC_ENABLED).toBeUndefined();
      }
    }
  });
});
