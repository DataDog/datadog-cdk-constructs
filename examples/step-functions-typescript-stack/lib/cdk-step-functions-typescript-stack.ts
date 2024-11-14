import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { DatadogStepFunctions, DatadogLambda } from "datadog-cdk-constructs-v2";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";

export class CdkStepFunctionsTypeScriptStack extends Stack {
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
      timeout: Duration.seconds(10),
      memorySize: 256,
      code: lambda.Code.fromAsset("../lambda/python", {
        bundling: {
          image: lambda.Runtime.PYTHON_3_12.bundlingImage,
          command: ["bash", "-c", "pip install -r requirements.txt -t /asset-output && cp -aT . /asset-output"],
        },
      }),
      handler: "hello.lambda_handler",
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
      forwarderArn: process.env.DD_FORWARDER_ARN,
      tags: "custom-tag-1:tag-value-1,custom-tag-2:tag-value-2",
    });
    datadogSfn.addStateMachines([childStateMachine, parentStateMachine]);

    const datadogLambda = new DatadogLambda(this, "DatadogLambda", {
      pythonLayerVersion: 101,
      extensionLayerVersion: 65,
      addLayers: true,
      apiKey: process.env.DD_API_KEY,
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
