# Datadog CDK Typescript Demo!

Use this Typescript v2 CDK Construct Demo application to test the [Datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library.

## Getting Started

1. cd into the `Typescript-v2` directory.

2. Run `yarn` to pull in the dependencies.

   _Note:_ If you are testing your changes to the Datadog CDK Construct, install the zip file with `yarn add file:/path/to/local/tarball.tgz` after running the above commands.

3. Run `yarn watch` in a seperate terminal window to ensure the Typscript files are compiled to Javascript.

4. Go to `lib/typescript_v2-stack.ts` and replace the layer versions with the Python and Node.js Lambda layers version number you would like to install.

   - Find the latest Python or Node.js version number:
     - Python: https://github.com/DataDog/datadog-lambda-python/releases
     - Node.js: https://github.com/DataDog/datadog-lambda-js/releases

5. Run `cdk synth` to synthesize the CloudFormation template. At this point you may need to resolve errors.

6. Run `aws-vault exec serverless-sandbox-account-admin -- cdk diff` to see the resource and permission changes that are made.

7. Deploy the CDK stack to sandbox account with the `forwarderArn` parameter:
   - Replace <FORWARDER_ARN> with the desired Datadog Fowarder ARN.

```
aws-vault exec serverless-sandbox-account-admin -- cdk deploy TypescriptV2Stack --parameters datadogForwarderArn=datadogForwarderArn=arn:aws:lambda:us-east-1:425362996713:function:datadog-forwarder-self-monitoring
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