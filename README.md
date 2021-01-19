# Datadog CDK Constructs

Use this Datadog CDK Construct Library to deploy serverless applications using AWS CDK .

This CDK library automatically configures ingestion of metrics, traces, and logs from your serverless applications by:

- Installing and configuring the Datadog Lambda library for your [Python][1] and [Node.js][2] Lambda functions.

## Installation

Download the code and import datadog-cdk-constructs/lib/index.ts.

## Usage

### AWS CDK

import datadog-cdk-constructs/lib/index.ts.

**Typescript**

```typescript
import * as cdk from "@aws-cdk/core";
import { Datadog } from "datadog-cdk-constructs/lib/index";

class CdkStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const datadog = new Datadog(this, "Datadog", {
      lambdaFunctions: [<LAMBDA_FUNCTIONS>],
      nodeLayerVersion: <LAYER_VERSION>,
      pythonLayerVersion: <LAYER_VERSION>,
      addLayers: <BOOLEAN>,
      forwarderArn: "<FORWARDER_ARN>"
    });
  }
}
```

## Configuration

To further configure your plugin, use the following custom parameters:

| Parameter            | Description                                                                                                                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lambdaFunctions`    | List of lambda functions (both python and node) for which Datadog monitoring is to be added.                                                                                                                                                                         |
| `addLayers`          | Whether to add the Lambda Layers or expect the user to bring their own. Defaults to true. When true, the Lambda Library version variables are also required. When false, you must include the Datadog Lambda library in your functions' deployment packages.         |
| `pythonLayerVersion` | Version of the Python Lambda layer to install, such as 21. Required if you are deploying at least one Lambda function written in Python and `addLayers` is true. Find the latest version number from [https://github.com/DataDog/datadog-lambda-python/releases][5]. |
| `nodeLayerVersion`   | Version of the Node.js Lambda layer to install, such as 29. Required if you are deploying at least one Lambda function written in Node.js and `addLayers` is true. Find the latest version number from [https://github.com/DataDog/datadog-lambda-js/releases][6].   |
| `forwarderArn`         | When set, the plugin will automatically subscribe the functions' log groups to the Datadog Forwarder.  |

## How it works

The CDK construct takes in a list of lambda functions and installs the Datadog Lambda Library by attaching the Lambda Layers for [Node.js][2] and [Python][1] to your functions. It redirects to a replacement handler that initializes the Lambda Library without any required code changes.

[1]: https://github.com/DataDog/datadog-lambda-layer-python
[2]: https://github.com/DataDog/datadog-lambda-layer-js
[3]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-macros.html
[4]: https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_core.Stack.html
[5]: https://github.com/DataDog/datadog-lambda-python/releases
[6]: https://github.com/DataDog/datadog-lambda-js/releases
[7]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-logs-subscriptionfilter.html

## Opening Issues

If you encounter a bug with this package, we want to hear about it. Before opening a new issue, search the existing issues to avoid duplicates.

When opening an issue, include the Datadog CDK Construct version, Node version, and stack trace if available. In addition, include the steps to reproduce when appropriate.

You can also open an issue for a feature request.

## Contributing

If you find an issue with this package and have a fix, please feel free to open a pull request following the [procedures](https://github.com/DataDog/datadog-cdk-constructs/blob/main/CONTRIBUTING.md).

## Community

For product feedback and questions, join the `#serverless` channel in the [Datadog community on Slack](https://chat.datadoghq.com/).

## License

Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.

This product includes software developed at Datadog (https://www.datadoghq.com/). Copyright 2021 Datadog, Inc.
