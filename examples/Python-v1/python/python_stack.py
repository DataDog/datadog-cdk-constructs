import aws_cdk.core as cdk
import aws_cdk.aws_apigateway as apigateway
import aws_cdk.aws_logs as cwlogs
import aws_cdk.aws_lambda as lambda_
from datadog_cdk_constructs import Datadog


class PythonStack(cdk.Stack):
    def __init__(self, scope: cdk.Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        hello = lambda_.Function(
            self,
            "hello",
            runtime=lambda_.Runtime.NODEJS_10_X,
            code=lambda_.Code.from_asset("lambda"),
            handler="hello.handler",
        )

        hello1 = lambda_.Function(
            self,
            "hello1",
            runtime=lambda_.Runtime.PYTHON_3_7,
            code=lambda_.Code.from_asset("lambda"),
            handler="hello_py.lambda_handler",
        )

        prd_log_group = cwlogs.LogGroup(self, "PrdLogs")

        datadogForwarderArn = cdk.CfnParameter(
            self,
            "datadogForwarderArn",
            type="String",
            description="The Arn of the Datadog AWS Lambda forwarder function which will send data to Datadog.",
        )
        datadog = Datadog(
            self,
            "Datadog",
            node_layer_version="<NodeLayer>",
            python_layer_version="<PythonLayer>",
            add_layers=True,
            forwarder_arn=datadogForwarderArn.value_as_string,
            enable_datadog_tracing=True,
            flush_metrics_to_logs=True,
            site="datadoghq.com",
        )
        datadog.add_lambda_functions([hello, hello1])
        datadog.add_forwarder_to_non_lambda_log_groups([prd_log_group])
