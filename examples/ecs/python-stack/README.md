# Datadog CDK Python Example

Use this example Python stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library.

## Getting Started

1. Get a Datadog API key to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Run `export DD_API_KEY=<DATADOG_API_KEY>` to set the Datadog API key in your shell session.
1. Run `virtualenv env` to create a virtual environment.
1. Run `source env/bin/activate` to activate the virtual environment.
1. Run `pip install -r requirements.txt` to install dependencies.
1. Run `cdk diff` to see the resource and permission changes that are made.
1. Run `cdk deploy` to deploy the stack to AWS.
1. Invoke your ECS Task Defintions and look for them in [Datadog](https://app.datadoghq.com/) (metrics, traces, logs, orchestrator explorer, etc.).

## Testing

When updating the Datadog CDK package and running a python example, you can test locally by following the steps below:

1. Run `yarn build` to create the Python package.
1. Run `cp dist/python/datadog_cdk_constructs_v2-$VERSION.tar.gz examples/ecs/python-stack` to copy your local module.
1. Run `cd examples/ecs/python-stack` to navigate to the stack.
1. Run `virtualenv env && source env/bin/activate` to create a virtual environment.
1. Run `pip install -r requirements.txt` to install dependencies.
1. Run `pip install ./datadog_cdk_constructs_v2-$VERSION.tar.gz` to install your local module.
1. Run `cdk synth` to view your updated yaml task definition.
1. Run `cdk deploy` to deploy your updated resources.
