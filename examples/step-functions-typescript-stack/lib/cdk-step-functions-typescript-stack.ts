import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import { Duration, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { DatadogStepFunctions } from "datadog-cdk-constructs-v2";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";

export class CdkStepFunctionsTypeScriptStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    console.log("Creating Hello World TypeScript stack");

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

    const stateMachine = new sfn.StateMachine(this, "CdkTypeScriptTestStateMachine", {
      definitionBody: sfn.DefinitionBody.fromChainable(
        new tasks.LambdaInvoke(this, "MyLambdaTask", {
          lambdaFunction: helloLambdaFunction,
        }).next(new sfn.Succeed(this, "GreetedWorld")),
      ),
    });

    console.log("Instrumenting Step Functions in TypeScript stack with Datadog");

    const datadogSfn = new DatadogStepFunctions(this, "Datadog", {});
    datadogSfn.addStateMachines([stateMachine]);
  }
}
