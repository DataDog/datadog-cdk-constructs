from aws_cdk import (
    aws_lambda as _lambda,
    aws_lambda_go_alpha as go,
    BundlingOptions,
    Duration,
    Stack,
)
from constructs import Construct
from datadog_cdk_constructs_v2 import Datadog
import os


class CdkPythonStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        print("Creating Hello World Python stack")

        hello_node = _lambda.Function(
            self,
            "hello-node",
            runtime=_lambda.Runtime.NODEJS_20_X,
            timeout=Duration.seconds(10),
            code=_lambda.Code.from_asset(
                "../lambda/node",
                bundling=BundlingOptions(
                    image=_lambda.Runtime.NODEJS_20_X.bundling_image,
                    command=[
                        "bash",
                        "-c",
                        "cp -aT . /asset-output && npm install --prefix /asset-output",
                    ],
                    user="root",
                ),
            ),
            handler="hello.lambda_handler",
        )

        hello_python = _lambda.Function(
            self,
            "hello-python",
            runtime=_lambda.Runtime.PYTHON_3_11,
            timeout=Duration.seconds(10),
            code=_lambda.Code.from_asset(
                "../lambda/python",
                bundling=BundlingOptions(
                    image=_lambda.Runtime.PYTHON_3_11.bundling_image,
                    command=[
                        "bash",
                        "-c",
                        "pip install -r requirements.txt -t /asset-output && cp -aT . /asset-output",
                    ],
                ),
            ),
            handler="hello.lambda_handler",
        )

        hello_go = go.GoFunction(
            self,
            "hello-go",
            entry="../lambda/go/hello.go",
            runtime=_lambda.Runtime.PROVIDED_AL2,
            timeout=Duration.seconds(10),
            bundling=go.BundlingOptions(
                go_build_flags=['-ldflags "-s -w"'],
            ),
        )

        datadog = Datadog(
            self,
            "Datadog",
            node_layer_version=100,
            python_layer_version=83,
            extension_layer_version=51,
            add_layers=True,
            api_key=os.getenv("DD_API_KEY"),
            enable_datadog_tracing=True,
            enable_datadog_asm=True,
            flush_metrics_to_logs=True,
            site="datadoghq.com",
        )
        datadog.add_lambda_functions([hello_node, hello_python, hello_go])
