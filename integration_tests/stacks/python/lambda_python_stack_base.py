from aws_cdk import (
    aws_lambda as _lambda,
    aws_lambda_go_alpha as go,
    BundlingOptions,
    BundlingOutput,
    Duration,
    Stack,
)
from constructs import Construct


class LambdaPythonStackBase(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        hello_node = _lambda.Function(
            self,
            "hello-node",
            runtime=_lambda.Runtime.NODEJS_20_X,
            timeout=Duration.seconds(10),
            memory_size=256,
            code=_lambda.Code.from_asset(
                "../examples/lambda/node",
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
            memory_size=256,
            code=_lambda.Code.from_asset(
                "../examples/lambda/python",
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
            entry="../examples/lambda/go/hello.go",
            runtime=_lambda.Runtime.PROVIDED_AL2,
            timeout=Duration.seconds(10),
            bundling=go.BundlingOptions(
                go_build_flags=['-ldflags "-s -w"'],
            ),
        )

        hello_dotnet = _lambda.Function(
            self,
            "hello-dotnet",
            runtime=_lambda.Runtime.DOTNET_8,
            handler="HelloWorld::HelloWorld.Handler::SayHi",
            timeout=Duration.seconds(10),
            memory_size=256,
            code=_lambda.Code.from_asset(
                "../examples/lambda/dotnet",
                bundling=BundlingOptions(
                    image=_lambda.Runtime.DOTNET_8.bundling_image,
                    command=[
                        '/bin/sh',
                        '-c',
                        ' dotnet tool install -g Amazon.Lambda.Tools' +
                        ' && dotnet build' +
                        ' && dotnet lambda package --output-package /asset-output/function.zip'
                    ],
                    user="root",
                    output_type=BundlingOutput.ARCHIVED
                ),
            ),
        )

        self.lambdaFunctions = [hello_node, hello_python, hello_go, hello_dotnet]
