# Datadog CDK Python Example

Use this example Python stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library. It contains Node, Python and Go Lambda functions.

## Getting Started

1. Get a Datadog API key to be used to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Run `export DD_API_KEY=<DATADOG_API_KEY>` to set the Datadog API key in your shell session.
1. Run `virtualenv env` to create a virtual environment.
1. Run `source env/bin/activate` to activate the virtual environment.
1. Run `pip install -r requirements` install dependencies.
1. Update the layer versions in [lib/cdk_python_stack.py](https://github.com/DataDog/datadog-cdk-constructs/blob/d2f1f60b7e0594ae77dd76a7f5964bee651e8022/examples/python-stack/cdk_python/cdk_python_stack.py#L72-L74) with the latest releases:
   - Datadog Lambda Extension: https://github.com/DataDog/datadog-lambda-extension/releases
   - Python Layer: https://github.com/DataDog/datadog-lambda-python/releases
   - Node Layer: https://github.com/DataDog/datadog-lambda-js/releases
1. Run `cdk synth` to synthesize the CloudFormation template.
1. Run `cdk diff` to see the resource and permission changes that are made.
1. Run `cdk deploy` to deploy the stack to AWS.
1. Invoke your Lambda functions and look for them in [Datadog Serverless Monitoring](https://app.datadoghq.com/functions).

![Image 2023-11-02 at 11 44 22 AM](https://github.com/DataDog/datadog-cdk-constructs/assets/35278470/9c7b7b15-27ff-4de1-8f54-f5c352f1774b)
