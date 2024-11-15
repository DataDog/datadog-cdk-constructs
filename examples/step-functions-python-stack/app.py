#!/usr/bin/env python3
from aws_cdk import App
from cdk_step_functions_python_stack import CdkStepFunctionsPythonStack

app = App()
CdkStepFunctionsPythonStack(app, "CdkStepFunctionsPythonStack")

app.synth()
