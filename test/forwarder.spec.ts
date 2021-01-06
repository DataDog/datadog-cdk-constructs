import * as cdk from "@aws-cdk/core";
import "@aws-cdk/assert/jest";
import * as lambda from "@aws-cdk/aws-lambda";
import { addForwarder } from "../lib/forwarder";

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
});
