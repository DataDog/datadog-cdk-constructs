import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import { DatadogStepFunctions } from "../src/datadog-step-functions";
import { DatadogLambda, DatadogStepFunctionsProps } from "../src/index";

const versionJson = require("../version.json");
const EXTENSION_LAYER_VERSION = 5;
const NODE_LAYER_VERSION = 91;
const PYTHON_LAYER_VERSION = 73;

describe("setTags for Lambda", () => {
  it("adds tags when forwarder is set", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello1 = new lambda.Function(stack, "HelloHandler1", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const hello2 = new lambda.Function(stack, "HelloHandler2", {
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });

    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      nodeLayerVersion: NODE_LAYER_VERSION,
      pythonLayerVersion: PYTHON_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      addLayers: true,
      enableDatadogTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
      apiKey: "1234",
      env: "test-env",
      service: "test-service",
      version: "1",
      tags: "team:avengers,project:marvel",
    });
    datadogLambda.addLambdaFunctions([hello1, hello2]);

    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "nodejs18.x",
      Tags: [
        {
          Key: "dd_cdk_construct",
          Value: `v${versionJson.version}`,
        },
        {
          Key: "env",
          Value: "test-env",
        },
        {
          Key: "project",
          Value: "marvel",
        },
        {
          Key: "service",
          Value: "test-service",
        },
        {
          Key: "team",
          Value: "avengers",
        },
        {
          Key: "version",
          Value: "1",
        },
      ],
    });
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "python3.8",
      Tags: [
        {
          Key: "dd_cdk_construct",
          Value: `v${versionJson.version}`,
        },
        {
          Key: "env",
          Value: "test-env",
        },
        {
          Key: "project",
          Value: "marvel",
        },
        {
          Key: "service",
          Value: "test-service",
        },
        {
          Key: "team",
          Value: "avengers",
        },
        {
          Key: "version",
          Value: "1",
        },
      ],
    });
  });
  it("does not add tags when forwarder isn't set", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const hello1 = new lambda.Function(stack, "HelloHandler1", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });
    const hello2 = new lambda.Function(stack, "HelloHandler2", {
      runtime: lambda.Runtime.PYTHON_3_8,
      code: lambda.Code.fromInline("test"),
      handler: "hello.handler",
    });

    const datadogLambda = new DatadogLambda(stack, "Datadog", {
      nodeLayerVersion: NODE_LAYER_VERSION,
      pythonLayerVersion: PYTHON_LAYER_VERSION,
      extensionLayerVersion: EXTENSION_LAYER_VERSION,
      addLayers: true,
      enableDatadogTracing: false,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
      apiKey: "1234",
      env: "test-env",
      service: "test-service",
      version: "1",
      tags: "team:avengers,project:marvel",
    });
    datadogLambda.addLambdaFunctions([hello1, hello2]);

    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "nodejs18.x",
      Tags: [
        {
          Key: "dd_cdk_construct",
          Value: `v${versionJson.version}`,
        },
      ],
    });
    Template.fromStack(stack).hasResourceProperties("AWS::Lambda::Function", {
      Runtime: "python3.8",
      Tags: [
        {
          Key: "dd_cdk_construct",
          Value: `v${versionJson.version}`,
        },
      ],
    });
  });
});

describe("setTags for Step Function", () => {
  it("adds DD tags and custom tags", () => {
    const stack = new Stack();
    const stateMachine = new sfn.StateMachine(stack, "StateMachine", {
      definitionBody: sfn.DefinitionBody.fromChainable(new sfn.Pass(stack, "PassState")),
    });

    const props: DatadogStepFunctionsProps = {
      env: "dev",
      service: "my-service",
      version: "1.0.0",
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
      tags: "custom-tag-1:tag-value-1,custom-tag-2:tag-value-2",
    };

    const datadogSfn = new DatadogStepFunctions(stack, "DatadogStepFunctions", props);
    datadogSfn.addStateMachines([stateMachine]);

    Template.fromStack(stack).hasResourceProperties("AWS::StepFunctions::StateMachine", {
      Tags: [
        {
          Key: "custom-tag-1",
          Value: "tag-value-1",
        },
        {
          Key: "custom-tag-2",
          Value: "tag-value-2",
        },
        {
          Key: "dd_cdk_construct",
          Value: `v${versionJson.version}`,
        },
        {
          Key: "DD_TRACE_ENABLED",
          Value: "true",
        },
        {
          Key: "env",
          Value: "dev",
        },
        {
          Key: "service",
          Value: "my-service",
        },
        {
          Key: "version",
          Value: "1.0.0",
        },
      ],
    });
  });
});
