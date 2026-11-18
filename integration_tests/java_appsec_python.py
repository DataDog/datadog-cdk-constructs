"""Run against an installed local Python wheel; synthesizes only, never deploys.

After building and installing the wheel in a virtual environment, run:
    python integration_tests/java_appsec_python.py
"""

from pathlib import Path
import unittest

from aws_cdk import App, Stack, aws_lambda as lambda_
from aws_cdk.assertions import Template
from datadog_cdk_constructs_v2 import DatadogLambda, DatadogAppSecMode


class JavaAppSecTest(unittest.TestCase):
    def synthesize(self, java_version, extension_version, mode=DatadogAppSecMode.ON):
        stack = Stack(App(), "Stack")
        function = lambda_.Function(
            stack,
            "Function",
            runtime=lambda_.Runtime.JAVA_21,
            handler="example.Handler::handleRequest",
            code=lambda_.Code.from_asset(str(Path(__file__).parent / "lambda")),
        )
        datadog = DatadogLambda(
            stack,
            "Datadog",
            api_key="test",
            source_code_integration=False,
            java_layer_version=java_version,
            extension_layer_version=extension_version,
            datadog_app_sec_mode=mode,
        )
        datadog.add_lambda_functions([function])
        functions = Template.from_stack(stack).find_resources("AWS::Lambda::Function")
        return next(iter(functions.values()))["Properties"]["Environment"]["Variables"]

    def test_automatic_selection(self):
        cases = [
            (30, 101, False),
            (30, 102, False),
            (31, 101, False),
            (31, 102, True),
            (32, 103, True),
        ]
        for java, extension, tracer in cases:
            with self.subTest(java=java, extension=extension):
                env = self.synthesize(java, extension)
                self.assertEqual(env.get("DD_APPSEC_ENABLED"), "true" if tracer else None)
                self.assertEqual(env["DD_SERVERLESS_APPSEC_ENABLED"], str(not tracer).lower())
                self.assertEqual(env["AWS_LAMBDA_EXEC_WRAPPER"], "/opt/datadog_wrapper")

    def test_explicit_extension(self):
        env = self.synthesize(31, 102, DatadogAppSecMode.EXTENSION)
        self.assertEqual(env["DD_SERVERLESS_APPSEC_ENABLED"], "true")
        self.assertNotIn("DD_APPSEC_ENABLED", env)

    def test_explicit_tracer_forces_enablement(self):
        env = self.synthesize(30, 101, DatadogAppSecMode.TRACER)
        self.assertEqual(env["DD_APPSEC_ENABLED"], "true")
        self.assertEqual(env["DD_SERVERLESS_APPSEC_ENABLED"], "false")


if __name__ == "__main__":
    unittest.main()
