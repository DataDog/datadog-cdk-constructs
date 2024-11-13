# Datadog CDK Python Example

Use this example Python stack to try out the [datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library for Step Functions.

## Getting Started

1. Get a Datadog API key to send monitoring data ([Datadog API keys documentation](https://docs.datadoghq.com/account_management/api-app-keys/#add-an-api-key-or-client-token)).
2. Run `export DD_API_KEY=<DATADOG_API_KEY>` to set the Datadog API key in your shell session.
3. Set up Datadog forwarder ([Datadog Forwarder documentation](https://docs.datadoghq.com/logs/guide/forwarder/?tab=cloudformation#installation)).
4. Run `export DD_FORWARDER_ARN=<DD_FORWARDER_ARN>` to set the Datadog forwarder ARN in your shell session.
5. Run `virtualenv env` to create a virtual environment.
6. Run `source env/bin/activate` to activate the virtual environment.
7. Run `pip install -r requirements.txt` to install dependencies.
8. Run `cdk synth` to synthesize the CloudFormation template.
9. Run `cdk diff` to see the resource and permission changes that are made.
10. Run `cdk deploy` to deploy the stack to AWS.
11. Invoke your Step Function and look for them in [Datadog Serverless Monitoring](https://app.datadoghq.com/functions?cloud=aws&entity_view=step_functions).

![Datadog CDK Python Stack](https://github.com/user-attachments/assets/fad74221-237a-4641-b27b-24f9e7d059ed)
