import { App, Stack } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { LambdaRestApi, LogGroupLogDestination } from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { LogGroup } from "aws-cdk-lib/aws-logs";

import { addForwarder, addForwarderToLogGroups } from "../src/forwarder";
import { findDatadogSubscriptionFilters } from "./test-utils";

describe("Forwarder", () => {
  it("applies the subscription filter correctly", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "us-gov-east-1",
      },
    });
    const nodeLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    addForwarder(stack, [nodeLambda], "arn:test:forwarder:sa-east-1:12345678:1", false);
    Template.fromStack(stack).hasResourceProperties("AWS::Logs::SubscriptionFilter", {
      DestinationArn: "arn:test:forwarder:sa-east-1:12345678:1",
      FilterPattern: "",
    });
  });

  it("Subscribes the same forwarder to two different lambda functions via one addForwarder function call", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const nodeLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const pythonLambda = new lambda.Function(stack, "PythonHandler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });

    addForwarder(stack, [nodeLambda, pythonLambda], "arn:test:forwarder:sa-east-1:12345678:1", false);

    const nodeLambdaSubscriptionFilters = findDatadogSubscriptionFilters(nodeLambda);
    const pythonLambdaSubscriptionFilters = findDatadogSubscriptionFilters(pythonLambda);
    expect(nodeLambdaSubscriptionFilters).toHaveLength(1);
    expect(pythonLambdaSubscriptionFilters).toHaveLength(1);
    expect(nodeLambdaSubscriptionFilters[0].destinationArn).toEqual(pythonLambdaSubscriptionFilters[0].destinationArn);
  });

  it("Subscribes two different forwarders to two different lambda functions via separate addForwarder function calls", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const nodeLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const pythonLambda = new lambda.Function(stack, "PythonHandler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });

    addForwarder(stack, [nodeLambda], "arn:test:forwarder:sa-east-1:12345678:1", false);
    addForwarder(stack, [pythonLambda], "arn:test:forwarder:sa-east-1:12345678:2", false);

    const nodeLambdaSubscriptionFilters = findDatadogSubscriptionFilters(nodeLambda);
    const pythonLambdaSubscriptionFilters = findDatadogSubscriptionFilters(pythonLambda);
    expect(nodeLambdaSubscriptionFilters).toHaveLength(1);
    expect(pythonLambdaSubscriptionFilters).toHaveLength(1);
    expect(nodeLambdaSubscriptionFilters[0].destinationArn).not.toEqual(
      pythonLambdaSubscriptionFilters[0].destinationArn,
    );
  });

  it("Produces stable log subscription resource ids", () => {
    const createStack = (functionId: string) => {
      const app = new App();
      const stack = new Stack(app, "stack", {
        env: {
          region: "us-gov-east-1",
        },
      });
      const pythonLambda = new lambda.Function(stack, functionId, {
        runtime: lambda.Runtime.PYTHON_3_7,
        code: lambda.Code.fromAsset("test"),
        handler: "hello.handler",
      });
      addForwarder(stack, [pythonLambda], "arn:test:forwarder:sa-east-1:12345678:1", false);

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

  it("Produces different log subscription resource ids when the forwarder changes", () => {
    const createStack = (forwarderArn: string) => {
      const app = new App();
      const stack = new Stack(app, "stack", {
        env: {
          region: "us-gov-east-1",
        },
      });
      const pythonLambda = new lambda.Function(stack, "PythonHandler", {
        runtime: lambda.Runtime.PYTHON_3_7,
        code: lambda.Code.fromAsset("test"),
        handler: "hello.handler",
      });
      const nodeLambda = new lambda.Function(stack, "NodeHandler", {
        runtime: lambda.Runtime.NODEJS_18_X,
        code: lambda.Code.fromAsset("test"),
        handler: "hello.handler",
      });
      addForwarder(stack, [pythonLambda, nodeLambda], forwarderArn, false);

      return stack;
    };

    const stackOne = createStack("arn:test:forwarder:sa-east-1:12345678:1");
    const stackTwo = createStack("arn:test:forwarder:sa-east-1:12345678:2");

    const stackOneSubscriptions = findDatadogSubscriptionFilters(stackOne);
    const stackTwoSubscriptions = findDatadogSubscriptionFilters(stackTwo);

    expect(stackOneSubscriptions).toHaveLength(2);
    expect(stackOneSubscriptions[0].id).not.toEqual(stackOneSubscriptions[1].id);
    expect(stackTwoSubscriptions[0].destinationArn).toEqual(stackTwoSubscriptions[1].destinationArn);

    expect(stackTwoSubscriptions).toHaveLength(2);
    expect(stackTwoSubscriptions[0].id).not.toEqual(stackTwoSubscriptions[1].id);
    expect(stackTwoSubscriptions[0].destinationArn).toEqual(stackTwoSubscriptions[1].destinationArn);

    expect(stackOneSubscriptions[0].destinationArn).not.toEqual(stackTwoSubscriptions[0].destinationArn);
    expect(stackOneSubscriptions[0].id).not.toEqual(stackTwoSubscriptions[0].id);
  });

  it("Subscribes the forwarder to a log group via the addForwarderToLogGroups function", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const pythonLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const restLogGroup = new LogGroup(stack, "restLogGroup");
    new LambdaRestApi(stack, "rest-test", {
      handler: pythonLambda,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(restLogGroup),
      },
    });
    addForwarderToLogGroups(stack, [restLogGroup], "arn:test:forwarder:sa-east-1:12345678:1", false);
    Template.fromStack(stack).hasResourceProperties("AWS::Logs::SubscriptionFilter", {
      DestinationArn: "arn:test:forwarder:sa-east-1:12345678:1",
      FilterPattern: "",
    });
  });
  it("Subscribes the forwarder to an imported log group via the addForwarderToLogGroups function", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const logGroup = LogGroup.fromLogGroupName(stack, "LogGroup", "logGroupName");
    addForwarderToLogGroups(stack, [logGroup], "arn:test:forwarder:sa-east-1:12345678:1", false);
    Template.fromStack(stack).hasResourceProperties("AWS::Logs::SubscriptionFilter", {
      DestinationArn: "arn:test:forwarder:sa-east-1:12345678:1",
      FilterPattern: "",
    });
  });
  it("Subscribes the forwarder to multiple log groups via the addForwarderToLogGroups function", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const nodeLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const nodeLogGroup = new LogGroup(stack, "NodeLogGroup");
    new LambdaRestApi(stack, "node-lambda", {
      handler: nodeLambda,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(nodeLogGroup),
      },
    });
    const pythonLambda = new lambda.Function(stack, "PythonHandler", {
      runtime: lambda.Runtime.PYTHON_3_7,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const pythonLogGroup = new LogGroup(stack, "PythonLogGroup");
    new LambdaRestApi(stack, "python-lambda", {
      handler: pythonLambda,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(pythonLogGroup),
      },
    });

    addForwarderToLogGroups(stack, [nodeLogGroup, pythonLogGroup], "arn:test:forwarder:sa-east-1:12345678:1", false);
    const stackSubcriptions = findDatadogSubscriptionFilters(stack);

    expect(stackSubcriptions).toHaveLength(2);
  });
  it("Subscribes to two separate log groups when addForwarder and addForwarderToLogGroups functions are called", () => {
    const app = new App();
    const stack = new Stack(app, "stack", {
      env: {
        region: "sa-east-1",
      },
    });
    const pythonLambda = new lambda.Function(stack, "NodeHandler", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("test"),
      handler: "hello.handler",
    });
    const restLogGroup = new LogGroup(stack, "restLogGroup");
    new LambdaRestApi(stack, "rest-test", {
      handler: pythonLambda,
      deployOptions: {
        accessLogDestination: new LogGroupLogDestination(restLogGroup),
      },
    });
    addForwarder(stack, [pythonLambda], "arn:test:forwarder:sa-east-1:12345678:1", false);
    addForwarderToLogGroups(stack, [restLogGroup], "arn:test:forwarder:sa-east-1:12345678:2", false);
    Template.fromStack(stack).hasResourceProperties("AWS::Logs::SubscriptionFilter", {
      DestinationArn: "arn:test:forwarder:sa-east-1:12345678:1",
      FilterPattern: "",
    });
    Template.fromStack(stack).hasResourceProperties("AWS::Logs::SubscriptionFilter", {
      DestinationArn: "arn:test:forwarder:sa-east-1:12345678:2",
      FilterPattern: "",
    });
  });
});
