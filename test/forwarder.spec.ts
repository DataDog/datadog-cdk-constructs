import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import "@aws-cdk/assert/jest";
import { addForwarder } from "../src/forwarder";
import { findDatadogSubscriptionFilters } from "./test-utils";

describe("Forwarder", () => {
  it("applies the subscription filter correctly", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "us-gov-east-1",
      },
    });
    const pythonLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    addForwarder(stack, [pythonLambda], "forwarder-arn");
    expect(stack).toHaveResource("AWS::Logs::SubscriptionFilter", {
      DestinationArn: "forwarder-arn",
      FilterPattern: "",
    });
  });

  it("Subscribes the same forwarder to two different lambda functions via one addForwarder function call", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const nodeLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const pythonLambda = new lambda.Function(stack, "PythonHandler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });

    addForwarder(stack, [nodeLambda, pythonLambda], "forwarder-arn");

    const [nodeLambdaSubscriptionFilter] = findDatadogSubscriptionFilters(nodeLambda);
    const [pythonLambdaSubscriptionFilter] = findDatadogSubscriptionFilters(pythonLambda);

    expect(nodeLambdaSubscriptionFilter).toBeDefined();
    expect(pythonLambdaSubscriptionFilter).toBeDefined();
    expect(nodeLambdaSubscriptionFilter.destinationArn).toEqual(pythonLambdaSubscriptionFilter.destinationArn);
  });

  it("Subscribes two different forwarders to two different lambda functions via separate addForwarder function calls", () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const nodeLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_10_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const pythonLambda = new lambda.Function(stack, "PythonHandler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });

    addForwarder(stack, [nodeLambda], "forwarder-arn");
    addForwarder(stack, [pythonLambda], "forwarder-arn-2");

    const [nodeLambdaSubscriptionFilter] = findDatadogSubscriptionFilters(nodeLambda);
    const [pythonLambdaSubscriptionFilter] = findDatadogSubscriptionFilters(pythonLambda);
    expect(nodeLambdaSubscriptionFilter).toBeDefined();
    expect(pythonLambdaSubscriptionFilter).toBeDefined();
    expect(nodeLambdaSubscriptionFilter.destinationArn).not.toEqual(pythonLambdaSubscriptionFilter.destinationArn);
  });

  it("Produces stable log subscription resource ids", () => {
    const createStack = (functionId: string) => {
      const app = new cdk.App();
      const stack = new cdk.Stack(app, "stack", {
        env: {
          region: "us-gov-east-1",
        },
      });
      const pythonLambda = new lambda.Function(stack, functionId, {
        runtime: lambda.Runtime.PYTHON_3_7,
        code: lambda.Code.fromAsset("test"),
        handler: "hello.handler",
      });
      addForwarder(stack, [pythonLambda], "forwarder-arn");

      return stack;
    };

    const initialStack = createStack("PythonHandler");
    const identicalStack = createStack("PythonHandler");
    const differentStack = createStack("OtherHandler");

    const [initialStackSubscription] = findDatadogSubscriptionFilters(initialStack);
    const [identicalStackSubscription] = findDatadogSubscriptionFilters(identicalStack);
    const [differentStackSubscription] = findDatadogSubscriptionFilters(differentStack);

    expect(initialStackSubscription.id).toEqual(identicalStackSubscription.id);
    expect(initialStackSubscription.id).not.toEqual(differentStackSubscription.id);
  });
});
