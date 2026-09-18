#!/usr/bin/env python3
from aws_cdk import App
from cdk_python.cdk_python_stack import CdkPythonStack

app = App()
CdkPythonStack(app, "CdkPythonStack")

app.synth()
