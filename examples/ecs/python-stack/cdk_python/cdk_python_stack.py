from constructs import Construct
from datadog_cdk_constructs_v2 import DatadogECSFargate, Cardinality
from aws_cdk import Stack
from aws_cdk import aws_ecs as ecs
import os

class CdkPythonStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        ecsDatadog = DatadogECSFargate(
            api_key=os.getenv("DD_API_KEY"),
            dogstatsd={
                "dogstatsd_cardinality": Cardinality.HIGH,
                "is_origin_detection_enabled": True,
            },
            global_tags="owner:datadog, team:contp",
        )

        task = ecsDatadog.fargate_task_definition(self, "PythonFargateTask")

        task.add_container(
            id = "dogstatsd-app",
            image = ecs.ContainerImage.from_registry("ghcr.io/datadog/apps-dogstatsd:main"),
        )
