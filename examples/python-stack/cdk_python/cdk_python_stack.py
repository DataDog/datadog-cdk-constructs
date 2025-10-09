from constructs import Construct
from datadog_cdk_constructs_v2 import DatadogLambda, DatadogLambdaProps
import os
from cdk_python.cdk_python_stack_base import CdkPythonStackBase


class CdkPythonStack(CdkPythonStackBase):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        datadog = DatadogLambda(
            self,
            "Datadog",
            dotnet_layer_version=15,
            node_layer_version=107,
            python_layer_version=89,
            extension_layer_version=55,
            add_layers=True,
            api_key=os.getenv("DD_API_KEY"),
            enable_datadog_tracing=True,
            datadog_app_sec_mode="on",
            flush_metrics_to_logs=True,
            site="datadoghq.com",
        )

        # Ensure DatadogLambdaProps can be imported properly
        props = DatadogLambdaProps()
        datadog.add_lambda_functions(self.lambdaFunctions)
