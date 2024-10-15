#!/usr/bin/env python3
from aws_cdk import App
from cdk_python.cdk_python_stack import CdkPythonStack
from cdk_python.cdk_python_lambda_old_api_stack import CdkPythonLambdaOldApiStack

app = App()
CdkPythonStack(app, "CdkPythonStack")
CdkPythonLambdaOldApiStack(app, "CdkPythonLambdaOldApiStack")

app.synth()
