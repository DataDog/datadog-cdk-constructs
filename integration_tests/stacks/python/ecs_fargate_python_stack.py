from aws_cdk import App, Stack
from aws_cdk import aws_ecs as ecs
from constructs import Construct
from datadog_cdk_constructs_v2 import (
    APMInstrumentationConfig,
    DatadogECSFargate,
    TracerLanguage,
)


class EcsFargatePythonStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        ecs_datadog = DatadogECSFargate(api_key="exampleApiKey", env="prod")

        task_definition = ecs_datadog.fargate_task_definition(
            self,
            "apmInstrumentationTaskDefinition",
            ecs.FargateTaskDefinitionProps(memory_limit_mib=512, cpu=256),
            apm_instrumentation=APMInstrumentationConfig(
                language=TracerLanguage.PYTHON,
                container_name="pythonApp",
            ),
        )
        task_definition.add_container(
            "pythonApp",
            image=ecs.ContainerImage.from_registry("ecs-sample-image/python-app"),
            # the tracer is appended to this value
            environment={"PYTHONPATH": "/app"},
        )
        task_definition.add_container(
            "worker",
            image=ecs.ContainerImage.from_registry("ecs-sample-image/worker"),
        )


app = App()
EcsFargatePythonStack(app, "EcsFargatePythonStack")
app.synth()
