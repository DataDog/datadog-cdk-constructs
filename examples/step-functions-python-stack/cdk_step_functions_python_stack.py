from aws_cdk import (
    Duration,
    Stack,
    BundlingOptions,
    aws_lambda as _lambda,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
)
import os
from constructs import Construct
from datadog_cdk_constructs_v2 import DatadogStepFunctions, DatadogLambda


class CdkStepFunctionsPythonStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        print("Setting up the child state machine")

        pass_state = sfn.Pass(self, "PassState")
        wait_state = sfn.Wait(
            self, "WaitState", time=sfn.WaitTime.duration(Duration.seconds(1))
        )
        success_state = sfn.Succeed(self, "SuccessState")

        child_state_machine = sfn.StateMachine(
            self,
            "CdkPythonTestChildStateMachine",
            definition_body=sfn.DefinitionBody.from_chainable(
                pass_state.next(wait_state).next(success_state)
            ),
        )

        print("Setting up the parent state machine")

        invoke_child_state_machine_task = tasks.StepFunctionsStartExecution(
            self,
            "InvokeChildStateMachineTask",
            state_machine=child_state_machine,
            input=sfn.TaskInput.from_object(
                DatadogStepFunctions.build_step_function_task_input_to_merge_traces(
                    {"custom-key": "custom-value"}
                )
            ),
        )

        hello_lambda_function = _lambda.Function(
            self,
            "hello-python",
            runtime=_lambda.Runtime.PYTHON_3_12,
            timeout=Duration.seconds(10),
            memory_size=256,
            code=_lambda.Code.from_asset(
                "../lambda/python",
                bundling=BundlingOptions(
                    image=_lambda.Runtime.PYTHON_3_12.bundling_image,
                    command=[
                        "bash",
                        "-c",
                        "pip install -r requirements.txt -t /asset-output && cp -aT . /asset-output",
                    ],
                ),
            ),
            handler="hello.lambda_handler",
        )

        lambda_task = tasks.LambdaInvoke(
            self,
            "MyLambdaTask",
            lambda_function=hello_lambda_function,
            payload=sfn.TaskInput.from_object(
                DatadogStepFunctions.build_lambda_payload_to_merge_traces()
            ),
        )

        parent_state_machine = sfn.StateMachine(
            self,
            "CdkPythonTestStateMachine",
            definition_body=sfn.DefinitionBody.from_chainable(
                lambda_task.next(invoke_child_state_machine_task)
            ),
        )

        # Instrument the lambda functions and the state machines
        print("Instrumenting Step Functions in Python stack with Datadog")

        datadog_sfn = DatadogStepFunctions(
            self,
            "DatadogSfn",
            env="dev",
            service="cdk-test-service",
            version="1.0.0",
            forwarder_arn=os.getenv("DD_FORWARDER_ARN"),
            tags="custom-tag-1:tag-value-1,custom-tag-2:tag-value-2",
        )
        datadog_sfn.add_state_machines([child_state_machine, parent_state_machine])

        datadog_lambda = DatadogLambda(
            self,
            "DatadogLambda",
            python_layer_version=101,
            extension_layer_version=65,
            add_layers=True,
            api_key=os.getenv("DD_API_KEY"),
            enable_datadog_tracing=True,
            datadog_app_sec_mode="on",
            flush_metrics_to_logs=True,
            site="datadoghq.com",
            env="dev",
            service="cdk-test-service",
            version="1.0.0",
        )
        datadog_lambda.add_lambda_functions([hello_lambda_function])
