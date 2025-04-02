# Datadog CDK Python Example

Use this example Python stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library.

## Getting Started

1. Get a Datadog API key to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
1. Set the Datadog API key in your shell session: `export DD_API_KEY=<DATADOG_API_KEY>`.
1. Create a virtual environment: `virtualenv env`
1. Activate the virtual environment: `source env/bin/activate`
1. Install dependencies: `pip install -r requirements.txt`
1. Review the resource and permission changes: `cdk diff`.
1. Deploy the stack to AWS: `cdk deploy`.
1. Invoke your ECS Task Defintions and verify data in [Datadog](https://app.datadoghq.com/) (metrics, traces, logs, orchestrator explorer, etc.).

## Testing

When updating the Datadog CDK package and testing with a Python example, follow the steps below to test locally:

1. Run `yarn build` to create the Python package.
1. Copy the local module: `cp dist/python/datadog_cdk_constructs_v2-$VERSION.tar.gz examples/ecs/python-stack`.
1. Navigate to the example stack directory: `cd examples/ecs/python-stack`.
1. Create a virtual environment: `virtualenv env && source env/bin/activate`.
1. Install dependencies: `pip install -r requirements.txt`.
1. Install your local module: `pip install ./datadog_cdk_constructs_v2-$VERSION.tar.gz`.
1. View your updated YAML task definition: `cdk synth`.
1. Deploy your updated resources: `cdk deploy`.
