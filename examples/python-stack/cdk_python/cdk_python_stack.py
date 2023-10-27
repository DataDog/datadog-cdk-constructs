from aws_cdk import (
    aws_lambda as _lambda,
    aws_lambda_go_alpha as go,
    Stack,
)
from constructs import Construct
from datadog_cdk_constructs_v2 import Datadog
import os


class CdkPythonStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        hello_node = _lambda.Function(
            self,
            "hello-node",
            runtime=_lambda.Runtime.NODEJS_16_X,
            code=_lambda.Code.from_asset("../lambda/javascript"),
            handler="hello.lambda_handler",
        )

        hello_python = _lambda.Function(
            self,
            "hello-python",
            runtime=_lambda.Runtime.PYTHON_3_7,
            code=_lambda.Code.from_asset("../lambda/python"),
            handler="hello.lambda_handler",
        )

        hello_go = go.GoFunction(
            self,
            "hello-go",
            entry="../lambda/go/hello.go",
            runtime=_lambda.Runtime.PROVIDED_AL2,
            bundling=go.BundlingOptions(
                go_build_flags=['-ldflags "-s -w"'],
            ),
        )

        datadog = Datadog(
            self,
            "Datadog",
            node_layer_version=99,
            python_layer_version=81,
            extension_layer_version=49,
            add_layers=True,
            api_key=os.getenv("DD_API_KEY"),
            enable_datadog_tracing=True,
            enable_datadog_asm=True,
            flush_metrics_to_logs=True,
            site="datadoghq.com",
        )
        datadog.add_lambda_functions([hello_node, hello_python, hello_go])
