# Datadog CDK Constructs

[![NPM](https://img.shields.io/npm/v/datadog-cdk-constructs?color=blue&label=npm+cdk+v1)](https://www.npmjs.com/package/datadog-cdk-constructs)
[![NPM](https://img.shields.io/npm/v/datadog-cdk-constructs-v2?color=39a356&label=npm+cdk+v2)](https://www.npmjs.com/package/datadog-cdk-constructs-v2)
[![PyPI](https://img.shields.io/pypi/v/datadog-cdk-constructs?color=blue&label=pypi+cdk+v1)](https://pypi.org/project/datadog-cdk-constructs/)
[![PyPI](https://img.shields.io/pypi/v/datadog-cdk-constructs-v2?color=39a356&label=pypi+cdk+v2)](https://pypi.org/project/datadog-cdk-constructs-v2/)
[![Go](https://img.shields.io/github/v/tag/datadog/datadog-cdk-constructs-go?color=39a356&label=go+cdk+v2)](https://pkg.go.dev/github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue)](https://github.com/DataDog/datadog-cdk-constructs/blob/main/LICENSE)

Use this Datadog CDK Construct Library to deploy serverless applications using AWS CDK .

This CDK library automatically configures ingestion of metrics, traces, and logs from your serverless applications by:

- Installing and configuring the Datadog Lambda layers for your [.NET][19], [Java][15], [Node.js][2], and [Python][1] Lambda functions.
- Enabling the collection of traces and custom metrics from your Lambda functions.
- Managing subscriptions from the Datadog Forwarder to your Lambda and non-Lambda log groups.

## AWS CDK v1 vs AWS CDK v2

**WARNING**: `AWS CDK v1` has reached end-of-support and `datadog-cdk-constructs` will no longer be receiving updates. It's strongly recommended to upgrade to `AWS CDK v2` ([official migration guide](https://docs.aws.amazon.com/cdk/v2/guide/migrating-v2.html)) and switch to using `datadog-cdk-constructs-v2`.

Two separate versions of Datadog CDK Constructs exist; `datadog-cdk-constructs` and `datadog-cdk-constructs-v2`. These are designed to work with `AWS CDK v1` and `AWS CDK v2` respectively.

- `datadog-cdk-constructs-v2` requires Node >= 14, while `datadog-cdk-constructs` supports Node >= 12.
- `datadog-cdk-constructs-v2` contains more features.
- Otherwise, the use of the two packages is identical.

## Lambda

### Package Installation

#### npm

For use with AWS CDK v2:

```
yarn add --dev datadog-cdk-constructs-v2
# or
npm install datadog-cdk-constructs-v2 --save-dev
```

For use with AWS CDK v1:

```
yarn add --dev datadog-cdk-constructs
# or
npm install datadog-cdk-constructs --save-dev
```

#### PyPI

For use with AWS CDK v2:

```
pip install datadog-cdk-constructs-v2
```

For use with AWS CDK v1:

```
pip install datadog-cdk-constructs
```

##### Note:

Pay attention to the output from your package manager as the `Datadog CDK Construct Library` has peer dependencies.

#### Go

For use with AWS CDK v2:

```
go get github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v2
```

AWS CDK v1 is not supported.

### Usage

#### AWS CDK

_The following examples assume the use of AWS CDK v2. If you're using CDK v1, import `datadog-cdk-constructs` rather than `datadog-cdk-constructs-v2`._

Add this to your CDK stack:

#### TypeScript

```typescript
import { DatadogLambda } from "datadog-cdk-constructs-v2";

const datadogLambda = new DatadogLambda(this, "datadogLambda", {
  nodeLayerVersion: <LAYER_VERSION>,
  pythonLayerVersion: <LAYER_VERSION>,
  javaLayerVersion: <LAYER_VERSION>,
  dotnetLayerVersion: <LAYER_VERSION>
  addLayers: <BOOLEAN>,
  extensionLayerVersion: "<EXTENSION_VERSION>",
  forwarderArn: "<FORWARDER_ARN>",
  createForwarderPermissions: <BOOLEAN>,
  flushMetricsToLogs: <BOOLEAN>,
  site: "<SITE>",
  apiKey: "{Datadog_API_Key}",
  apiKeySecretArn: "{Secret_ARN_Datadog_API_Key}",
  apiKeySecret: <AWS_CDK_ISECRET>, // Only available in datadog-cdk-constructs-v2
  apiKmsKey: "{Encrypted_Datadog_API_Key}",
  enableDatadogTracing: <BOOLEAN>,
  enableMergeXrayTraces: <BOOLEAN>,
  enableDatadogLogs: <BOOLEAN>,
  injectLogContext: <BOOLEAN>,
  logLevel: <STRING>,
  env: <STRING>, //Optional
  service: <STRING>, //Optional
  version: <STRING>, //Optional
  tags: <STRING>, //Optional
});
datadogLambda.addLambdaFunctions([<LAMBDA_FUNCTIONS>])
datadogLambda.addForwarderToNonLambdaLogGroups([<LOG_GROUPS>])
```

#### Go

```go
import (
	"github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v2"
)
datadogLambda := ddcdkconstruct.NewDatadogLambda(
    stack,
    jsii.String("Datadog"),
    &ddcdkconstruct.DatadogLambdaProps{
        NodeLayerVersion:      jsii.Number(<LAYER_VERSION>),
        AddLayers:             jsii.Bool(<BOOLEAN>),
        Site:                  jsii.String(<SITE>),
        ApiKey:                jsii.String(os.Getenv("DD_API_KEY")),
        // ...
    })
datadogLambda.AddLambdaFunctions(&[]interface{}{myFunction}, nil)
datadogLambda.AddForwarderToNonLambdaLogGroups()
```

### Source Code Integration

[Source code integration](https://docs.datadoghq.com/integrations/guide/source-code-integration/) is enabled by default through automatic lambda tagging, and will work if:

- The Datadog Github integration is installed.
- Your datadog-cdk dependency satisfies either of the below versions:
  - `datadog-cdk-constructs-v2` >= 1.4.0
  - `datadog-cdk-constructs` >= 0.8.5

#### Alternative Methods to Enable Source Code Integration

If the automatic implementation doesn't work for your case, please follow one of the two guides below.

**Note: these alternate guides only work for Typescript.**

<details>
  <summary>datadog-cdk version satisfied, but Datadog Github integration NOT installed</summary>

If the Datadog Github integration is not installed, you need to import the `datadog-ci` package and manually upload your Git metadata to Datadog.
For the best results, import the `datadog-ci` package where your CDK Stack is initialized.

```typescript
const app = new cdk.App();

// Make sure to add @datadog/datadog-ci via your package manager
const datadogCi = require("@datadog/datadog-ci");
// Manually uploading Git metadata to Datadog.
datadogCi.gitMetadata.uploadGitCommitHash("{Datadog_API_Key}", "<SITE>");

const app = new cdk.App();
new ExampleStack(app, "ExampleStack", {});

app.synth();
```

</details>
<details>
  <summary>datadog-cdk version NOT satisfied</summary>

Change your initialization function as follows (in this case, `gitHash` value is passed to the CDK):

```typescript
async function main() {
  // Make sure to add @datadog/datadog-ci via your package manager
  const datadogCi = require("@datadog/datadog-ci");
  const [, gitHash] = await datadogCi.gitMetadata.uploadGitCommitHash("{Datadog_API_Key}", "<SITE>");

  const app = new cdk.App();
  // Pass in the hash to the ExampleStack constructor
  new ExampleStack(app, "ExampleStack", {}, gitHash);
}
```

Ensure you call this function to initialize your stack.

In your stack constructor, change to add an optional `gitHash` parameter, and call `addGitCommitMetadata()`:

```typescript
export class ExampleStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps, gitHash?: string) {
    ...
    ...
    datadogLambda.addGitCommitMetadata([<YOUR_FUNCTIONS>], gitHash)
  }
}
```

</details>

### Configuration

To further configure your DatadogLambda construct for Lambda, use the following custom parameters:

_Note_: The descriptions use the npm package parameters, but they also apply to PyPI and Go package parameters.

| npm package parameter        | PyPI package parameter          | Description                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `addLayers`                  | `add_layers`                    | Whether to add the runtime Lambda Layers or expect the user to bring their own. Defaults to `true`. When `true`, the Lambda Library version variables are also required. When `false`, you must include the Datadog Lambda library in your functions' deployment packages.                                                                                                                                                     |
| `pythonLayerVersion`         | `python_layer_version`          | Version of the Python Lambda layer to install, such as `83`. Required if you are deploying at least one Lambda function written in Python and `addLayers` is `true`. Find the latest version number [here][5].                                                                                                                                                                                                                 |
| `nodeLayerVersion`           | `node_layer_version`            | Version of the Node.js Lambda layer to install, such as `100`. Required if you are deploying at least one Lambda function written in Node.js and `addLayers` is `true`. Find the latest version number from [here][6].                                                                                                                                                                                                         |
| `javaLayerVersion`           | `java_layer_version`            | Version of the Java layer to install, such as `8`. Required if you are deploying at least one Lambda function written in Java and `addLayers` is `true`. Find the latest version number in the [Serverless Java installation documentation][15]. **Note**: `extensionLayerVersion >= 25` and `javaLayerVersion >= 5` are required for the DatadogLambda construct to instrument your Java functions properly.                  |
| `dotnetLayerVersion`         | `dotnet_layer_version`          | Version of the .NET layer to install, such as `13`. Required if you are deploying at least one Lambda function written in .NET and `addLayers` is `true`. Find the latest version number from [here][18].                                                                                                                                                                                                                      |
| `extensionLayerVersion`      | `extension_layer_version`       | Version of the Datadog Lambda Extension layer to install, such as 5. When `extensionLayerVersion` is set, `apiKey` (or if encrypted, `apiKMSKey` or `apiKeySecretArn`) needs to be set as well. When enabled, lambda function log groups will not be subscribed by the forwarder. Learn more about the Lambda extension [here][12]. **Note**: If this parameter is set, it adds a layer even if `addLayers` is set to `false`. |
| `forwarderArn`               | `forwarder_arn`                 | When set, the plugin will automatically subscribe the Datadog Forwarder to the functions' log groups. Do not set `forwarderArn` when `extensionLayerVersion` is set.                                                                                                                                                                                                                                                           |
| `createForwarderPermissions` | `createForwarderPermissions`    | When set to `true`, creates a Lambda permission on the the Datadog Forwarder per log group. Since the Datadog Forwarder has permissions configured by default, this is unnecessary in most use cases.                                                                                                                                                                                                                          |
| `flushMetricsToLogs`         | `flush_metrics_to_logs`         | Send custom metrics using CloudWatch logs with the Datadog Forwarder Lambda function (recommended). Defaults to `true` . If you disable this parameter, it's required to set `apiKey` (or if encrypted, `apiKMSKey` or `apiKeySecretArn`).                                                                                                                                                                                     |
| `site`                       | `site`                          | Set which Datadog site to send data. This is only used when `flushMetricsToLogs` is `false` or `extensionLayerVersion` is set. Possible values are `datadoghq.com`, `datadoghq.eu`, `us3.datadoghq.com`, `us5.datadoghq.com`, `ap1.datadoghq.com`, and `ddog-gov.com`. The default is `datadoghq.com`.                                                                                                                         |
| `apiKey`                     | `api_key`                       | Datadog API Key, only needed when `flushMetricsToLogs` is `false` or `extensionLayerVersion` is set. For more information about getting a Datadog API key, see the [API key documentation][8].                                                                                                                                                                                                                                 |
| `apiKeySecretArn`            | `api_key_secret_arn`            | The ARN of the secret storing the Datadog API key in AWS Secrets Manager. Use this parameter in place of `apiKey` when `flushMetricsToLogs` is `false` or `extensionLayer` is set. Remember to add the `secretsmanager:GetSecretValue` permission to the Lambda execution role.                                                                                                                                                |
| `apiKeySecret`               | `api_key_secret`                | An [AWS CDK ISecret][16] representing a secret storing the Datadog API key in AWS Secrets Manager. Use this parameter in place of `apiKeySecretArn` to automatically grant your Lambda execution roles read access to the given secret. [See here](#automatically-grant-aws-secret-read-access-to-lambda-execution-role) for an example. **Only available in datadog-cdk-constructs-v2**.                                      |
| `apiKmsKey`                  | `api_kms_key`                   | Datadog API Key encrypted using KMS. Use this parameter in place of `apiKey` when `flushMetricsToLogs` is `false` or `extensionLayerVersion` is set, and you are using KMS encryption.                                                                                                                                                                                                                                         |
| `enableDatadogTracing`       | `enable_datadog_tracing`        | Enable Datadog tracing on your Lambda functions. Defaults to `true`.                                                                                                                                                                                                                                                                                                                                                           |
| `enableMergeXrayTraces`      | `enable_merge_xray_traces`      | Enable merging X-Ray traces on your Lambda functions. Defaults to `false`.                                                                                                                                                                                                                                                                                                                                                     |
| `enableDatadogLogs`          | `enable_datadog_logs`           | Send Lambda function logs to Datadog via the Datadog Lambda Extension. Defaults to `true`. Note: This setting has no effect on logs sent via the Datadog Forwarder.                                                                                                                                                                                                                                                            |
| `sourceCodeIntegration`      | `source_code_integration`       | Enable Datadog Source Code Integration, connecting your telemetry with application code in your Git repositories. This requires the Datadog Github integration to work, otherwise please follow the [alternative method](#alternative-methods-to-enable-source-code-integration). Learn more [here](https://docs.datadoghq.com/integrations/guide/source-code-integration/). Defaults to `true`.                               |
| `injectLogContext`           | `inject_log_context`            | When set, the Lambda layer will automatically patch console.log with Datadog's tracing ids. Defaults to `true`.                                                                                                                                                                                                                                                                                                                |
| `logLevel`                   | `log_level`                     | When set to `debug`, the Datadog Lambda Library and Extension will log additional information to help troubleshoot issues.                                                                                                                                                                                                                                                                                                     |
| `env`                        | `env`                           | When set along with `extensionLayerVersion`, a `DD_ENV` environment variable is added to all Lambda functions with the provided value. When set along with `forwarderArn`, an `env` tag is added to all Lambda functions with the provided value.                                                                                                                                                                              |
| `service`                    | `service`                       | When set along with `extensionLayerVersion`, a `DD_SERVICE` environment variable is added to all Lambda functions with the provided value. When set along with `forwarderArn`, a `service` tag is added to all Lambda functions with the provided value.                                                                                                                                                                       |
| `version`                    | `version`                       | When set along with `extensionLayerVersion`, a `DD_VERSION` environment variable is added to all Lambda functions with the provided value. When set along with `forwarderArn`, a `version` tag is added to all Lambda functions with the provided value.                                                                                                                                                                       |
| `tags`                       | `tags`                          | A comma separated list of key:value pairs as a single string. When set along with `extensionLayerVersion`, a `DD_TAGS` environment variable is added to all Lambda functions with the provided value. When set along with `forwarderArn`, the cdk parses the string and sets each key:value pair as a tag to all Lambda functions.                                                                                             |
| `enableColdStartTracing`     | `enable_cold_start_tracing`     | Set to `false` to disable Cold Start Tracing. Used in Node.js and Python. Defaults to `true`.                                                                                                                                                                                                                                                                                                                                  |
| `coldStartTraceMinDuration`  | `min_cold_start_trace_duration` | Sets the minimum duration (in milliseconds) for a module load event to be traced via Cold Start Tracing. Number. Defaults to `3`.                                                                                                                                                                                                                                                                                              |
| `coldStartTraceSkipLibs`     | `cold_start_trace_skip_libs`    | Optionally skip creating Cold Start Spans for a comma-separated list of libraries. Useful to limit depth or skip known libraries. Default depends on runtime.                                                                                                                                                                                                                                                                  |
| `enableProfiling`            | `enable_profiling`              | Enable the Datadog Continuous Profiler with `true`. Supported in Beta for Node.js and Python. Defaults to `false`.                                                                                                                                                                                                                                                                                                             |
| `encodeAuthorizerContext`    | `encode_authorizer_context`     | When set to `true` for Lambda authorizers, the tracing context will be encoded into the response for propagation. Supported for Node.js and Python. Defaults to `true`.                                                                                                                                                                                                                                                        |
| `decodeAuthorizerContext`    | `decode_authorizer_context`     | When set to `true` for Lambdas that are authorized via Lambda authorizers, it will parse and use the encoded tracing context (if found). Supported for Node.js and Python. Defaults to `true`.                                                                                                                                                                                                                                 |
| `apmFlushDeadline`           | `apm_flush_deadline`            | Used to determine when to submit spans before a timeout occurs, in milliseconds. When the remaining time in an AWS Lambda invocation is less than the value set, the tracer attempts to submit the current active spans and all finished spans. Supported for Node.js and Python. Defaults to `100` milliseconds.                                                                                                              |
| `redirectHandler`            | `redirect_handler`              | When set to `false`, skip redirecting handler to the Datadog Lambda Library's handler. Useful when only instrumenting with Datadog Lambda Extension. Defaults to `true`.                                                                                                                                                                                                                                                       |

**Note**: Using the parameters above may override corresponding function level `DD_XXX` environment variables.

#### Tracing

Enable X-Ray Tracing on your Lambda functions. For more information, see [CDK documentation][9].

```typescript
import * as lambda from "aws-cdk-lib/aws-lambda";

const lambda_function = new lambda.Function(this, "HelloHandler", {
  runtime: lambda.Runtime.NODEJS_14_X,
  code: lambda.Code.fromAsset("lambda"),
  handler: "hello.handler",
  tracing: lambda.Tracing.ACTIVE,
});
```

#### Nested Stacks

Add the Datadog CDK Construct to each stack you wish to instrument with Datadog. In the example below, we initialize the Datadog CDK Construct and call `addLambdaFunctions()` in both the `RootStack` and `NestedStack`.

```typescript
import { DatadogLambda } from "datadog-cdk-constructs-v2";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

class RootStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new NestedStack(this, "NestedStack");

    const datadogLambda = new DatadogLambda(this, "DatadogLambda", {
      nodeLayerVersion: <LAYER_VERSION>,
      pythonLayerVersion: <LAYER_VERSION>,
      javaLayerVersion: <LAYER_VERSION>,
      dotnetLayerVersion: <LAYER-VERSION>,
      addLayers: <BOOLEAN>,
      forwarderArn: "<FORWARDER_ARN>",
      flushMetricsToLogs: <BOOLEAN>,
      site: "<SITE>",
      apiKey: "{Datadog_API_Key}",
      apiKeySecretArn: "{Secret_ARN_Datadog_API_Key}",
      apiKmsKey: "{Encrypted_Datadog_API_Key}",
      enableDatadogTracing: <BOOLEAN>,
      enableMergeXrayTraces: <BOOLEAN>,
      enableDatadogLogs: <BOOLEAN>,
      injectLogContext: <BOOLEAN>
    });
    datadogLambda.addLambdaFunctions([<LAMBDA_FUNCTIONS>]);

  }
}

class NestedStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props?: cdk.NestedStackProps) {
    super(scope, id, props);

    const datadogLambda = new DatadogLambda(this, "DatadogLambda", {
      nodeLayerVersion: <LAYER_VERSION>,
      pythonLayerVersion: <LAYER_VERSION>,
      javaLayerVersion: <LAYER_VERSION>,
      dotnetLayerVersion: <LAYER-VERSION>,
      addLayers: <BOOLEAN>,
      forwarderArn: "<FORWARDER_ARN>",
      flushMetricsToLogs: <BOOLEAN>,
      site: "<SITE>",
      apiKey: "{Datadog_API_Key}",
      apiKeySecretArn: "{Secret_ARN_Datadog_API_Key}",
      apiKmsKey: "{Encrypted_Datadog_API_Key}",
      enableDatadogTracing: <BOOLEAN>,
      enableMergeXrayTraces: <BOOLEAN>,
      enableDatadogLogs: <BOOLEAN>,
      injectLogContext: <BOOLEAN>
    });
    datadogLambda.addLambdaFunctions([<LAMBDA_FUNCTIONS>]);

  }
}
```

#### Tags

Add tags to your constructs. We recommend setting an `env` and `service` tag to tie Datadog telemetry together. For more information see [official AWS documentation][10] and [CDK documentation][11].

### Automatically grant AWS secret read access to Lambda execution role

**Only available in datadog-cdk-constructs-v2**

To automatically grant your Lambda execution roles read access to a given secret, pass in `apiKeySecret` in place of `apiKeySecretArn` when initializing the DatadogLambda construct.

```typescript
const { Secret } = require('aws-cdk-lib/aws-secretsmanager');

const secret = Secret.fromSecretPartialArn(this, 'DatadogApiKeySecret', 'arn:aws:secretsmanager:us-west-1:123:secret:DATADOG_API_KEY');

const datadogLambda = new DatadogLambda(this, 'DatadogLambda', {
  ...
  apiKeySecret: secret
  ...
});
```

When `addLambdaFunctions` is called, the Datadog CDK construct grants your Lambda execution roles read access to the given AWS secret. This is done through the [AWS ISecret's grantRead function][17].

### How it works

The DatadogLambda construct takes in a list of lambda functions and installs the Datadog Lambda Library by attaching the Lambda Layers for [.NET][19], [Java][15], [Node.js][2], and [Python][1] to your functions. It redirects to a replacement handler that initializes the Lambda Library without any required code changes. Additional configurations added to the Datadog CDK construct will also translate into their respective environment variables under each lambda function (if applicable / required).

While Lambda function based log groups are handled by the `addLambdaFunctions` method automatically, the construct has an additional function `addForwarderToNonLambdaLogGroups` which subscribes the forwarder to any additional log groups of your choosing.

## Step Functions

Only AWS CDK v2 is supported.

### Usage

#### TypeScript

Example stack: [step-functions-typescript-stack](https://github.com/DataDog/datadog-cdk-constructs/tree/main/examples/step-functions-typescript-stack)

##### Basic setup

```
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import { DatadogStepFunctions} from "datadog-cdk-constructs-v2";

const stateMachine = new sfn.StateMachine(...);
const datadogSfn = new DatadogStepFunctions(this, "DatadogSfn", {
  env: "<ENV>", // e.g. "dev"
  service: "<SERVICE>", // e.g. "my-cdk-service"
  version: "<VERSION>", // e.g. "1.0.0"
  forwarderArn: "<FORWARDER_ARN>", // e.g. "arn:test:forwarder:sa-east-1:12345678:1"
  tags: <TAGS>, // optional, e.g. "custom-tag-1:tag-value-1,custom-tag-2:tag-value-2"
});
datadogSfn.addStateMachines([stateMachine]);
```

##### Merging traces

To merge the Step Function's traces with downstream Lambda function or Step function's traces, modify the Lambda task payload or Step Function task input:

```
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import { DatadogStepFunctions, DatadogLambda } from "datadog-cdk-constructs-v2";

const lambdaFunction = ...;
const lambdaTask = new tasks.LambdaInvoke(this, "MyLambdaTask", {
  lambdaFunction: lambdaFunction,
  payload: sfn.TaskInput.fromObject(
    DatadogStepFunctions.buildLambdaPayloadToMergeTraces(
      { "custom-key": "custom-value" }
    )
  ),
});

const childStateMachine = new sfn.StateMachine(...);
const invokeChildStateMachineTask = new tasks.StepFunctionsStartExecution(this, "InvokeChildStateMachineTask", {
  stateMachine: childStateMachine,
  input: sfn.TaskInput.fromObject(
    DatadogStepFunctions.buildStepFunctionTaskInputToMergeTraces({ "custom-key": "custom-value" }),
  ),
});

const stateMachine = new sfn.StateMachine(this, "CdkTypeScriptTestStateMachine", {
  definitionBody: sfn.DefinitionBody.fromChainable(lambdaTask.next(invokeChildStateMachineTask)),
});

const datadogLambda = ...;
datadogLambda.addLambdaFunctions([lambdaFunction]);

const datadogSfn = ...;
datadogSfn.addStateMachines([childStateMachine, stateMachine]);
```

#### Python

Example stack: [step-functions-python-stack](https://github.com/DataDog/datadog-cdk-constructs/tree/main/examples/step-functions-python-stack)

##### Basic setup

```
from aws_cdk import (
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
)
from datadog_cdk_constructs_v2 import DatadogStepFunctions, DatadogLambda

state_machine = sfn.StateMachine(...)
datadog_sfn = DatadogStepFunctions(
    self,
    "DatadogSfn",
    env="<ENV>", # e.g. "dev"
    service="<SERVICE>", # e.g. "my-cdk-service"
    version="<VERSION>", # e.g. "1.0.0"
    forwarderArn="<FORWARDER_ARN>", # e.g. "arn:test:forwarder:sa-east-1:12345678:1"
    tags=<TAGS>, # optional, e.g. "custom-tag-1:tag-value-1,custom-tag-2:tag-value-2"
)
datadog_sfn.add_state_machines([child_state_machine, parent_state_machine])
```

##### Merging traces

To merge the Step Function's traces with downstream Lambda function or Step function's traces, modify the Lambda task payload or Step Function task input:

```
from aws_cdk import (
    aws_lambda,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
)
from datadog_cdk_constructs_v2 import DatadogStepFunctions, DatadogLambda

lambda_function = aws_lambda.Function(...)
lambda_task = tasks.LambdaInvoke(
    self,
    "MyLambdaTask",
    lambda_function=lambda_function,
    payload=sfn.TaskInput.from_object(
        DatadogStepFunctions.build_lambda_payload_to_merge_traces(
            {"custom-key": "custom-value"}
        )
    ),
)

child_state_machine = sfn.StateMachine(...)
invoke_child_state_machine_task = tasks.StepFunctionsStartExecution(
    self,
    "InvokeChildStateMachineTask",
    state_machine=child_state_machine,
    input=sfn.TaskInput.from_object(
        DatadogStepFunctions.build_step_function_task_input_to_merge_traces(
            {"custom-key": "custom-value"}
        )
    ),
)

state_machine = sfn.StateMachine(
    self,
    "CdkPythonTestStateMachine",
    definition_body=sfn.DefinitionBody.from_chainable(
        lambda_task.next(invoke_child_state_machine_task)
    ),
)

datadog_lambda = DatadogLambda(...)
datadog_lambda.add_lambda_functions([lambda_function])

datadog_sfn = DatadogStepFunctions(...)
datadog_sfn.add_state_machines([child_state_machine, state_machine])
```

#### Go

Example stack: [step-functions-go-stack](https://github.com/DataDog/datadog-cdk-constructs/tree/main/examples/step-functions-go-stack)

##### Basic setup

```
import (
	"github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	sfn "github.com/aws/aws-cdk-go/awscdk/v2/awsstepfunctions"
)

stack := awscdk.NewStack(...)
stateMachine := sfn.NewStateMachine(...)
datadogSfn := ddcdkconstruct.NewDatadogStepFunctions(
  stack,
  jsii.String("DatadogSfn"),
  &ddcdkconstruct.DatadogStepFunctionsProps{
    Env:            jsii.String("<ENV>"), // e.g. "dev"
    Service:        jsii.String("<SERVICE>), // e.g. "my-cdk-service"
    Version:        jsii.String("<VERSION>"), // e.g. "1.0.0"
    ForwarderArn:   jsii.String("<FORWARDER_ARN>"), // e.g. "arn:test:forwarder:sa-east-1:12345678:1"
    Tags:           jsii.String("<TAGS>"), // optional, e.g. "custom-tag-1:tag-value-1,custom-tag-2:tag-value-2"
  }
)
datadogSfn.AddStateMachines(&[]sfn.StateMachine{stateMachine}, nil)
```

##### Merging traces

To merge the Step Function's traces with downstream Lambda function or Step function's traces, modify the Lambda task payload or Step Function task input:

```
import (
	"github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	sfn "github.com/aws/aws-cdk-go/awscdk/v2/awsstepfunctions"
	sfntasks "github.com/aws/aws-cdk-go/awscdk/v2/awsstepfunctionstasks"
	"github.com/aws/jsii-runtime-go"
)

lambdaFunction := awslambda.NewFunction(...)
lambdaPayload := ddcdkconstruct.DatadogStepFunctions_BuildLambdaPayloadToMergeTraces(&map[string]interface{}{
  "custom-key": "custom-value",
})
lambdaTask := sfntasks.NewLambdaInvoke(stack, jsii.String("MyLambdaTask"), &sfntasks.LambdaInvokeProps{
  LambdaFunction: lambdaFunction,
  Payload: sfn.TaskInput_FromObject(lambdaPayload),
})

childStateMachine := sfn.NewStateMachine(...)
stateMachineTaskInput := ddcdkconstruct.DatadogStepFunctions_BuildStepFunctionTaskInputToMergeTraces(
  &map[string]interface{}{
    "custom-key": "custom-value",
  }
)
invokeChildStateMachineTask := sfntasks.NewStepFunctionsStartExecution(
  stack,
  jsii.String("InvokeChildStateMachineTask"),
  &sfntasks.StepFunctionsStartExecutionProps{
    StateMachine: childStateMachine,
    Input: sfn.TaskInput_FromObject(stateMachineTaskInput),
  }
)
stateMachine := sfn.NewStateMachine(stack, jsii.String("CdkGoTestStateMachine"), &sfn.StateMachineProps{
  DefinitionBody: sfn.DefinitionBody_FromChainable(lambdaTask.Next(invokeChildStateMachineTask)),
})

datadogLambda := ...
datadogLambda.AddLambdaFunctions(&[]interface{}{lambdaFunction}, nil)

datadogSfn := ...
datadogSfn.AddStateMachines(&[]sfn.StateMachine{childStateMachine, stateMachine}, nil)
```

### Configuration

Parameters for creating the `DatadogStepFunctions` construct:

| npm package parameter | PyPI package parameter | Go package parameter | Description                                                                                                    |
| --------------------- | ---------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `env`                 | `env`                  | `Env`                | The `env` tag to be added to the state machine.                                                                |
| `service`             | `service`              | `Service`            | The `service` tag to be added to the state machine.                                                            |
| `version`             | `version`              | `Version`            | The `version` tag to be added to the state machine.                                                            |
| `forwarderArn`        | `forwarder_arn`        | `ForwarderArn`       | ARN or Datadog Forwarder, which will subscribe to the state machine's log group.                               |
| `tags`                | `tags`                 | `Tags`               | A comma separated list of key:value pairs as a single string, which will be added to the state machine's tags. |

### How it works

The `DatadogStepFunctions` construct takes in a list of state machines and for each of them:

1. Set up logging, including:
   1. Set log level to ALL
   2. Set includeExecutionData to true
   3. Create and set destination log group (if not set already)
   4. Add permissions to the state machine role to log to CloudWatch Logs
2. Subscribe Datadog Forwarder to the state machine's log group
3. Set tags, including:
   1. `env`
   2. `service`
   3. `version`
   4. `DD_TRACE_ENABLED`: `true`. This enables tracing.
      1. To disable tracing, set it to `false` from AWS Management Console after the stack is deployed.
      2. If you wish to disable tracing using CDK, please open an issue so we can support it.
   5. `dd_cdk_construct` version tag
   6. custom tags passed as the `tags` paramater to `DatadogStepFunctions` construct

To merge the Step Function's traces with downstream Lambda function or Step function's traces, the construct adds `$$.Execution`, `$$.State` and `$$.StateMachine` fields into the Step Function task input or Lambda task payload.

### Troubleshooting

#### Log group already exists

If `cdk deploy` fails with an error like:

> Resource of type 'AWS::Logs::LogGroup' with identifier '{"/properties/LogGroupName":"/aws/vendedlogs/states/CdkStepFunctionsTypeScriptStack1-CdkTypeScriptTestChildStateMachine-Logs-dev"}' already exists.

You have two options:

1. Delete the log group if you no longer need the logs in it. You may do so from AWS Management Console, at CloudWatch -> Logs -> Log groups.
2. Update the state machine definition if you wish to use the existing log group:

```
import * as logs from 'aws-cdk-lib/aws-logs';

const logGroupName = "/aws/vendedlogs/states/xxx";
const logGroup = logs.LogGroup.fromLogGroupName(stack, 'StateMachineLogGroup', logGroupName);

const stateMachine = new sfn.StateMachine(stack, 'MyStateMachine', {
  logs: {
    destination: logGroup,
  },
  ...
});
```

## Resources to learn about CDK

- If you are new to AWS CDK then check out this [workshop][14].
- [CDK TypeScript Workshop](https://cdkworkshop.com/20-typescript.html)
- [Video Introducing CDK by AWS with Demo](https://youtu.be/ZWCvNFUN-sU)
- [CDK Concepts](https://youtu.be/9As_ZIjUGmY)

## Using Projen

The Datadog CDK Construct Libraries use Projen to maintain project configuration files such as the `package.json`, `.gitignore`, `.npmignore`, etc. Most of the configuration files will be protected by Projen via read-only permissions. In order to change these files, edit the `.projenrc.js` file, then run `npx projen` to synthesize the new changes. Check out [Projen][13] for more details.

## Migrating from v2-1.x.x to v2-2.x.x

In February 2025, Datadog released a major version update from `1.x.x` to `2.x.x`. The required changes to migrate to the new version are as follows:

1. Rename the classes for instrumenting Lambda functions:

   1. `Datadog` -> `DatadogLambda`
   2. `DatadogProps` -> `DatadogLambdaProps`
      For examples, see the [Usage](#usage) section of this page and [examples/][20] folder of the GitHub repository.

2. Upgrade Node.js version to `18.18.0` or above.

3. For Go, change the import from:

   ```
   "github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct"
   ```

   to:

   ```
   "github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v2"
   ```

## Opening Issues

If you encounter a bug with this package, we want to hear about it. Before opening a new issue, search the existing issues to avoid duplicates.

When opening an issue, include the Datadog CDK Construct version, Node version, and stack trace if available. In addition, include the steps to reproduce when appropriate.

You can also open an issue for a feature request.

## Contributing

If you find an issue with this package and have a fix, please feel free to open a pull request following the [procedures](https://github.com/DataDog/datadog-cdk-constructs/blob/main/CONTRIBUTING.md).

## Testing

If you contribute to this package you can run the tests using `yarn test`. This package also includes a sample application for manual testing:

1. Open a seperate terminal.
2. Run `yarn watch`, this will ensure the Typescript files in the `src` directory are compiled to Javascript in the `lib` directory.
3. Navigate to `src/sample`, here you can edit `index.ts` to test your contributions manually.
4. At the root directory, run `npx cdk --app lib/sample/index.js <CDK Command>`, replacing `<CDK Command>` with common CDK commands like `synth`, `diff`, or `deploy`.

- Note, if you receive "... is not authorized to perform: ..." you may also need to authorize the commands with your AWS credentials.

### Debug Logs

To display the debug logs for this library for Lambda, set the `DD_CONSTRUCT_DEBUG_LOGS` env var to `true` when running `cdk synth` (use `--quiet` to suppress generated template output).

Example:
_Ensure you are at the root directory_

```
DD_CONSTRUCT_DEBUG_LOGS=true npx cdk --app lib/sample/index.js synth --quiet
```

## Community

For product feedback and questions, join the `#serverless` channel in the [Datadog community on Slack](https://chat.datadoghq.com/).

## License

Unless explicitly stated otherwise all files in this repository are licensed under the Apache License Version 2.0.

This product includes software developed at Datadog (https://www.datadoghq.com/). Copyright 2021 Datadog, Inc.

[1]: https://github.com/DataDog/datadog-lambda-layer-python
[2]: https://github.com/DataDog/datadog-lambda-layer-js
[3]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/template-macros.html
[4]: https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_core.Stack.html
[5]: https://github.com/DataDog/datadog-lambda-python/releases
[6]: https://github.com/DataDog/datadog-lambda-js/releases
[7]: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-logs-subscriptionfilter.html
[8]: https://docs.datadoghq.com/account_management/api-app-keys/#api-keys
[9]: https://docs.aws.amazon.com/cdk/api/latest/docs/@aws-cdk_aws-lambda.Tracing.html
[10]: https://docs.aws.amazon.com/cdk/latest/guide/tagging.html
[11]: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.Tags.html
[12]: https://docs.datadoghq.com/serverless/datadog_lambda_library/extension/
[13]: https://github.com/projen/projen
[14]: https://cdkworkshop.com/15-prerequisites.html
[15]: https://docs.datadoghq.com/serverless/installation/java/?tab=awscdk
[16]: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_secretsmanager.ISecret.html
[17]: https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_secretsmanager.ISecret.html#grantwbrreadgrantee-versionstages
[18]: https://github.com/DataDog/dd-trace-dotnet-aws-lambda-layer/releases
[19]: https://docs.datadoghq.com/serverless/aws_lambda/installation/dotnet
[20]: https://github.com/DataDog/datadog-cdk-constructs/tree/main/examples
