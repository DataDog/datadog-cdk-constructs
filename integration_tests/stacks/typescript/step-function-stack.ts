/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import { Duration, Stack, StackProps, App } from "aws-cdk-lib";
import { Construct } from "constructs";
import { DatadogStepFunctions, DatadogLambda } from "../../../src/index";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";

export class ExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    console.log("Creating Hello World TypeScript stack");

    /* Set up the child state machine */

    const passState = new sfn.Pass(this, "PassState");
    const waitState = new sfn.Wait(this, "WaitState", { time: sfn.WaitTime.duration(Duration.seconds(1)) });
    const successState = new sfn.Succeed(this, "SuccessState");

    const childStateMachine = new sfn.StateMachine(this, "CdkTypeScriptTestChildStateMachine", {
      definitionBody: sfn.DefinitionBody.fromChainable(passState.next(waitState).next(successState)),
    });

    /* Set up the parent state machine */

    const invokeChildStateMachineTask = new tasks.StepFunctionsStartExecution(this, "InvokeChildStateMachineTask", {
      stateMachine: childStateMachine,
      input: sfn.TaskInput.fromObject(
        DatadogStepFunctions.buildStepFunctionTaskInputToMergeTraces({ "custom-key": "custom-value" }),
      ),
    });

    const helloLambdaFunction = new lambda.Function(this, "hello-python", {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: "index.handler",
      code: lambda.Code.fromInline(`
      def handler(event, context):
        return "Hello, world!"
      `),
    });

    const lambdaTask = new tasks.LambdaInvoke(this, "MyLambdaTask", {
      lambdaFunction: helloLambdaFunction,
      payload: sfn.TaskInput.fromObject(DatadogStepFunctions.buildLambdaPayloadToMergeTraces()),
    });

    const parentStateMachine = new sfn.StateMachine(this, "CdkTypeScriptTestStateMachine", {
      definitionBody: sfn.DefinitionBody.fromChainable(lambdaTask.next(invokeChildStateMachineTask)),
    });

    /* Instrument the lambda functions and the state machines */

    console.log("Instrumenting Step Functions in TypeScript stack with Datadog");

    const datadogSfn = new DatadogStepFunctions(this, "DatadogSfn", {
      env: "dev",
      service: "cdk-test-service",
      version: "1.0.0",
      forwarderArn: "arn:test:forwarder:sa-east-1:12345678:1",
      tags: "custom-tag-1:tag-value-1,custom-tag-2:tag-value-2",
    });
    datadogSfn.addStateMachines([childStateMachine, parentStateMachine]);

    const datadogLambda = new DatadogLambda(this, "DatadogLambda", {
      pythonLayerVersion: 101,
      extensionLayerVersion: 65,
      addLayers: true,
      apiKey: "1234",
      enableDatadogTracing: true,
      enableDatadogASM: true,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
      env: "dev",
      service: "cdk-test-service",
      version: "1.0.0",
    });
    datadogLambda.addLambdaFunctions([helloLambdaFunction]);
  }
}

const app = new App();
const env = { account: "601427279990", region: "sa-east-1" };
const stack = new ExampleStack(app, "step-function-stack", { env: env });
console.log("Stack name: " + stack.stackName);
app.synth();
