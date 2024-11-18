import { Stack, Token } from "aws-cdk-lib";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import { DatadogStepFunctions, buildLogGroupName } from "../src/datadog-step-functions";

describe("DatadogStepFunctions", () => {
  describe("setUpLogging", () => {
    it("sets up log config if it's not set", () => {
      const stack = new Stack();
      const stateMachine = new sfn.StateMachine(stack, "StateMachine", {
        definitionBody: sfn.DefinitionBody.fromChainable(new sfn.Pass(stack, "PassState")),
      });

      const datadogSfn = new DatadogStepFunctions(stack, "DatadogStepFunctions", {});
      datadogSfn.addStateMachines([stateMachine]);

      const cfnStateMachine = stateMachine.node.defaultChild as sfn.CfnStateMachine;
      const logConfig = cfnStateMachine.loggingConfiguration as sfn.CfnStateMachine.LoggingConfigurationProperty;
      expect(logConfig.level).toBe("ALL");
      expect(logConfig.includeExecutionData).toBe(true);
      expect(logConfig.destinations).toHaveLength(1);
    });

    it("sets log level to ALL and includeExecutionData to true if they are not", () => {
      const stack = new Stack();
      const stateMachine = new sfn.StateMachine(stack, "StateMachine", {
        definitionBody: sfn.DefinitionBody.fromChainable(new sfn.Pass(stack, "PassState")),
        logs: {
          destination: new logs.LogGroup(stack, "LogGroup"),
          level: sfn.LogLevel.ERROR,
          includeExecutionData: false,
        },
      });

      const datadogSfn = new DatadogStepFunctions(stack, "DatadogStepFunctions", {});
      datadogSfn.addStateMachines([stateMachine]);

      const cfnStateMachine = stateMachine.node.defaultChild as sfn.CfnStateMachine;
      const logConfig = cfnStateMachine.loggingConfiguration as sfn.CfnStateMachine.LoggingConfigurationProperty;
      expect(logConfig.level).toBe("ALL");
      expect(logConfig.includeExecutionData).toBe(true);
      expect(logConfig.destinations).toHaveLength(1);
    });

    it("throws if loggingConfiguration is an unresolved token", () => {
      const stack = new Stack();
      const stateMachine = new sfn.StateMachine(stack, "StateMachine", {
        definitionBody: sfn.DefinitionBody.fromChainable(new sfn.Pass(stack, "PassState")),
      });

      const cfnStateMachine = stateMachine.node.defaultChild as sfn.CfnStateMachine;
      cfnStateMachine.loggingConfiguration = Token.asAny({});

      const datadogSfn = new DatadogStepFunctions(stack, "DatadogStepFunctions", {});
      expect(() => datadogSfn.addStateMachines([stateMachine])).toThrowError(
        "loggingConfiguration is an an unresolved token. Step Function Instrumentation is not supported. Please open a feature request in https://github.com/DataDog/datadog-cdk-constructs.",
      );
    });
  });
});

describe("buildLogGroupName", () => {
  test("builds log group name with env", () => {
    const stateMachine = {
      node: {
        path: "MyStack/MyStateMachine",
      },
    } as sfn.StateMachine;
    const logGroupName = buildLogGroupName(stateMachine, "dev");
    expect(logGroupName).toBe("/aws/vendedlogs/states/MyStack-MyStateMachine-Logs-dev");
  });

  test("builds log group name without env", () => {
    const stateMachine = {
      node: {
        path: "MyStack/MyStateMachine",
      },
    } as sfn.StateMachine;
    const logGroupName = buildLogGroupName(stateMachine, undefined);
    expect(logGroupName).toBe("/aws/vendedlogs/states/MyStack-MyStateMachine-Logs");
  });
});
