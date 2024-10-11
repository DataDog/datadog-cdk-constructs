from constructs import Construct
from datadog_cdk_constructs_v2 import Datadog, DatadogProps
import os
from cdk_python.cdk_python_stack_base import CdkPythonStackBase

class CdkPythonLambdaOldApiStack(CdkPythonStackBase):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        datadog = Datadog(
            self,
            "Datadog",
            dotnet_layer_version=15,
            node_layer_version=107,
            python_layer_version=89,
            extension_layer_version=55,
            add_layers=True,
            api_key=os.getenv("DD_API_KEY"),
            enable_datadog_tracing=True,
            enable_datadog_asm=True,
            flush_metrics_to_logs=True,
            site="datadoghq.com",
        )
        
        # Ensure DatadogProps can be imported properly
        props = DatadogProps()
        datadog.add_lambda_functions(self.lambdaFunctions)
