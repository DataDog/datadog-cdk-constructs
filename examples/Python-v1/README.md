# Datadog CDK Python Demo!

Use this CDK Construct Demo application to test the [Datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs).

## Getting Started

_Make sure you have `Python3` and `virtualenv` downloaded_

1. Create a virtualenv to hold this project's dependencies seperate from your global packages.
   To create a virtualenv:

```
python3 -m venv .venv
```

2. Activate your virtual environment.
   On MacOS and Linux:

```
source .venv/bin/activate
```

On Windows:

```
.venv\Scripts\activate.bat
```

3. Once the virtualenv is activated, you can install the required dependencies.

```
pip install -r requirements.txt
```

_note:_ If you are testing your changes to the Datadog CDK Construct, install the zip file with `pip3 install ./<datadog-cdk.zip>` after installing the requirements.

4. Go to `Python/python/python_stack.py` and replace <PythonLayer> and <NodeLayer> with the Python and Node.js Lambda layers you would like to install.
   Find the latest Python or Node.js version number:
   Python: https://github.com/DataDog/datadog-lambda-python/releases
   Node.js: https://github.com/DataDog/datadog-lambda-js/releases

5. Run `cdk synth` to synthesize the CloudFormation template. At this point you may need to resolve errors.

6. Run `aws-vault exec sandbox-account-admin -- cdk diff` to see the resource and permission changes that are made.

7. Deploy the CDK stack to sandbox account with the forwarderArn parameter:
   Replace <FORWARDER_ARN> with the desired Datadog Forwarder ARN.

```
aws-vault exec sandbox-account-admin -- cdk deploy CDK-Demo-Python --parameters datadogForwarderArn=<FORWARDER_ARN>
```

8. Invoke your lambda function(s), then search for them under the Serverless page on the Datadog app.
   Note:
   _Note_

- You may need to update the version of the Datadog CDK Constructs for the latest features. Here is the Github [Repo](https://github.com/DataDog/datadog-cdk-constructs).
- Checkout the repo for more parameters you can use to configure your Datadog CDK Construct.

To add additional dependencies, for example other CDK libraries, just add
them to your `setup.py` file and rerun the `pip install -r requirements.txt`
command.

## Useful commands

- `cdk ls` list all stacks in the app
- `cdk synth` emits the synthesized CloudFormation template
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk docs` open CDK documentation

Enjoy!
