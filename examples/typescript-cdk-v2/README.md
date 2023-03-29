# Datadog CDK Typescript Demo!

Use this Typescript v2 CDK Construct Demo application to test the [Datadog-cdk-constructs](https://github.com/DataDog/datadog-cdk-constructs) v2 library.

## Getting Started

1. cd into this `Typescript-v2` directory.

2. Run `yarn` to pull in the dependencies.

3. Run `yarn watch` in a seperate terminal window to ensure the Typscript files are compiled to Javascript.

4. Go to `lib/typescript_v2-stack.ts` and replace the layer versions with the Python and Node.js Lambda layers version number you would like to install.

   - Find the latest Python or Node.js version number:
     - Python: https://github.com/DataDog/datadog-lambda-python/releases
     - Node.js: https://github.com/DataDog/datadog-lambda-js/releases

5. Run `DD_API_KEY="key123" cdk synth` to synthesize the CloudFormation template. At this point you may need to resolve errors.

6. Run `DD_API_KEY="key123" cdk diff` to see the resource and permission changes that are made.

7. Deploy the CDK stack:

```
DD_API_KEY="key123" cdk deploy TypescriptV2Stack
```

8. Invoke your lambda functions, then search for them under the Serverless page on the Datadog app.

_Note_

- You may need to update the version of the Datadog CDK Constructs for the latest features
- Checkout the repo README for more parameters you can use to configure your Datadog CDK Construct
