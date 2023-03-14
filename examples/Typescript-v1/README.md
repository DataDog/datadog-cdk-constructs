# Datadog CDK Typescript Demo!

Use this CDK Construct Demo application to test the [Datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs).

## Getting Started

1. cd into the `Typescript` directory.

2. Run `yarn` or `npm install` to pull in the dependencies.

   _Note:_ If you are testing your changes to the Datadog CDK Construct, install the zip file with `yarn add file:/path/to/local/tarball.tgz` after running the above commands.

3. Run `yarn watch` in a seperate terminal window to ensure the Typscript files are compiled to Javascript.

4. Go to `src/index.ts` and replace `<PythonLayer>` and `<NodeLayer>` with the Python and Node.js Lambda layers version number you would like to install.

   - Find the latest Python or Node.js version number:
     - Python: https://github.com/DataDog/datadog-lambda-python/releases
     - Node.js: https://github.com/DataDog/datadog-lambda-js/releases

5. Run `cdk synth` to synthesize the CloudFormation template. At this point you may need to resolve errors.

6. Run `aws-vault exec sandbox-account-admin -- cdk diff` to see the resource and permission changes that are made.

7. Deploy the CDK stack to sandbox account with the `forwarderArn` parameter:
   - Replace <FORWARDER_ARN> with the desired Datadog Fowarder ARN.

```
aws-vault exec sandbox-account-admin -- cdk deploy CDK-Demo-Typescript --parameters datadogForwarderArn=<FORWARDER_ARN>
```

8. Invoke your lambda functions, then search for them under the Serverless page on the Datadog app.

_Note_

- You may need to update the version of the Datadog CDK Constructs for the latest features. Here is the Github [Repo](https://github.com/DataDog/datadog-cdk-constructs).
- Checkout the repo for more parameters you can use to configure your Datadog CDK Construct.

## Useful commands

- `cdk ls` list all stacks in the app
- `cdk synth` emits the synthesized CloudFormation template
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk docs` open CDK documentation

Enjoy!
