# Datadog ECS Fargate Construct

The `DatadogECSFargate` construct simplifies the process of monitoring ECS Fargate tasks with Datadog. It automatically configures the necessary resources and settings to enable metrics, traces, and logs collection for your ECS Fargate workloads.

**Note**: This construct is only available for AWS CDK v2 and `datadog-cdk-constructs-v2`. There is no support for AWS CDK v1.

## Installation

To use the `DatadogECSFargate` construct, install the `datadog-cdk-constructs-v2` package:

### npm

```bash
yarn add --dev datadog-cdk-constructs-v2
# or
npm install datadog-cdk-constructs-v2 --save-dev
```

### PyPI

```bash
pip install datadog-cdk-constructs-v2
```

### Go

```bash
go get github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v2
```

## Usage

### Typescript

```typescript
const ecsDatadog = new DatadogECSFargate({
  // One of the following 3 apiKey params are required
  apiKey: <STRING>
  apiKeySecret: <SECRET>,
  apiKeySecretArn: <STRING>,
  registry: <STRING>,
  imageVersion: <STRING>,
  cpu: <NUMBER>,
  memoryLimitMiB: <NUMBER>,
  isDatadogEssential: <BOOLEAN>,
  isDatadogDependencyEnabled: <BOOLEAN>,
  datadogHealthCheck: <HEALTH_CHECK>,
  site: <STRING>,
  clusterName: <STRING>,
  environmentVariables: <RECORD<STRING, STRING>>,
  globalTags: <STRING>,
  dogstatsd: <DOGSTATSD_FEATURE_CONFIG>,
  apm: <APM_FEATURE_CONFIG>,
  cws: <CWS_FEATURE_CONFIG>,
  logCollection: <LOG_COLLECTION_FEATURE_CONFIG>
  env: <STRING>
  service: <STRING>
  version: <STRING>
});
const fargateTaskDefinition = ecsDatadog.fargateTaskDefinition(
  this,
  "DatadogTypescriptTask",
  {<TASK_DEFINITION_PROPS>}, // optional
  {<DATADOG_ECS_FARGATE_PROPS>}, // optional override values
);
fargateTaskDefinition.addContainer(
  id=<STRING>,
  containerProps={
    image: ContainerImage.fromRegistry(<STRING>),
    ...
  }
)

// Or create task definition directly
const fargateTaskDefinition = new DatadogECSFargateTaskDefinition(
  this,
  "DatadogTypescriptTask2",
  // Fargate Task Definition Props
  {
      memoryLimitMiB: <NUMBER>,
      ...
  },
  // Datadog ECS Fargate Props
  {
    apiKeySecret: <SECRET>,
    ...
  },
)
```

### Python

```python
ecsDatadog = DatadogECSFargate(
    api_key=os.getenv("DD_API_KEY"),
    dogstatsd={
        "is_origin_detection_enabled": bool,
    },
    global_tags=str,
    ...
)
task = ecsDatadog.fargate_task_definition(
  self,
  "DatadogPythonTask",
  # optional: props=aws_cdk.aws_ecs.FargateTaskDefinitionProps
)
task.add_container(
    id=str,
    image=ecs.ContainerImage.from_registry(str),
    ...
)
```

### Golang

```golang
datadog := ddcdkconstruct.NewDatadogECSFargate(
  &ddcdkconstruct.DatadogECSFargateProps{
    ApiKey: jsii.String(os.Getenv("DD_API_KEY")),
  },
)
task := datadog.FargateTaskDefinition(
  stack,
  jsii.String("DatadogGolangTask"),
  // optional: &awsecs.FargateTaskDefinitionProps{},
  // optional: &ddcdkconstruct.DatadogECSFargateProps{},
)
task.AddContainer(
  jsii.String(string), // id
  &awsecs.ContainerDefinitionOptions{
    Image: awsecs.ContainerImage_FromRegistry(
      jsii.String(string),
      &awsecs.RepositoryImageProps{...},
    ),
    ...
  },
)
```

## Configuration

For more general information, reference the [Datadog ECS Fargate Docs](https://docs.datadoghq.com/integrations/ecs_fargate/). Custom configuration of the Datadog Agent is supported via the `environmentVariables` field of the props. The Datadog Agent container is available as a property of the `datadogFargateTaskDefinition` object which can be used to customize further as well. However, we recommend using the pre-defined configuration options within the interfaces when possible.

### DatadogECSFargateProps

| Property                     | Type                                | Description                                                                                                                                                                                                                                                                       |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apiKey`                     | `string`                            | The Datadog API key string. Must define at least 1 source for the API key.                                                                                                                                                                                                        |
| `apiKeySecret`               | `secrets.ISecret`                   | The Datadog API key secret. Must define at least 1 source for the API key.                                                                                                                                                                                                        |
| `apiKeySecretArn`            | `string`                            | The ARN of the Datadog API key secret. Must define at least 1 source for the API key.                                                                                                                                                                                             |
| `registry`                   | `string`                            | The registry to pull the Datadog Agent container image from.                                                                                                                                                                                                                      |
| `imageVersion`               | `string`                            | The version of the Datadog Agent container image to use.                                                                                                                                                                                                                          |
| `cpu`                        | `number`                            | The minimum number of CPU units to reserve for the Datadog Agent container.                                                                                                                                                                                                       |
| `memoryLimitMiB`             | `number`                            | The amount (in MiB) of memory to present to the Datadog Agent container.                                                                                                                                                                                                          |
| `isDatadogEssential`         | `boolean`                           | Configure Datadog Agent container to be essential for the task.                                                                                                                                                                                                                   |
| `isDatadogDependencyEnabled` | `boolean`                           | Configure added containers to have container dependency on the Datadog Agent container. Requires a defined health check. (This is useful when capturing all metrics/traces/etc is critical to a task. This gaurantees that the agent is available and ready to process the data.) |
| `datadogHealthCheck`         | `HealthCheck`                       | Configure health check for the Datadog Agent container.                                                                                                                                                                                                                           |
| `site`                       | `string`                            | The Datadog site to send data to.                                                                                                                                                                                                                                                 |
| `clusterName`                | `string`                            | The cluster name to use for tagging.                                                                                                                                                                                                                                              |
| `environmentVariables`       | `Record<string, string>`            | Datadog Agent environment variables. Used to customize your Datadog Agent configuration.                                                                                                                                                                                          |
| `globalTags`                 | `string`                            | Global tags to apply to all data sent by the Agent. Overrides any `DD_TAGS` values in `environmentVariables`.                                                                                                                                                                     |
| `checksCardinality`          | `Cardinality`                       | The tag cardinality for checks run by the Agent.                                                                                                                                                                                                                                  |
| `dogstatsd`                  | `DogstatsdFeatureConfig`            | DogStatsD feature configuration.                                                                                                                                                                                                                                                  |
| `apm`                        | `APMFeatureConfig`                  | APM feature configuration.                                                                                                                                                                                                                                                        |
| `cws`                        | `CWSFeatureConfig`                  | CWS feature configuration.                                                                                                                                                                                                                                                        |
| `logCollection`              | `FargateLogCollectionFeatureConfig` | Log collection configuration for Fargate.                                                                                                                                                                                                                                         |
| `env`                        | `string`                            | The task environment name. Used for tagging (UST).                                                                                                                                                                                                                                |
| `service`                    | `string`                            | The task service name. Used for tagging (UST).                                                                                                                                                                                                                                    |
| `version`                    | `string`                            | The task version. Used for tagging (UST).                                                                                                                                                                                                                                         |

### DogstatsdFeatureConfig

| Property                   | Type          | Description                                                                      |
| -------------------------- | ------------- | -------------------------------------------------------------------------------- |
| `isEnabled`                | `boolean`     | Enables DogStatsD.                                                               |
| `isOriginDetectionEnabled` | `boolean`     | Enables DogStatsD origin detection.                                              |
| `dogstatsdCardinality`     | `Cardinality` | Controls the cardinality of custom DogStatsD metrics.                            |
| `isSocketEnabled`          | `boolean`     | Enables DogStatsD traffic over Unix Domain Socket. Falls back to UDP when false. |

### APMFeatureConfig

| Property          | Type      | Description                                                                       |
| ----------------- | --------- | --------------------------------------------------------------------------------- |
| `isEnabled`       | `boolean` | Enables APM.                                                                      |
| `isSocketEnabled` | `boolean` | Enables APM traces traffic over Unix Domain Socket. Falls back to TCP when false. |

### CWSFeatureConfig

| Property         | Type      | Description                                                                    |
| ---------------- | --------- | ------------------------------------------------------------------------------ |
| `isEnabled`      | `boolean` | Enables CWS.                                                                   |
| `cpu`            | `number`  | The minimum number of CPU units to reserve for the Datadog CWS init container. |
| `memoryLimitMiB` | `number`  | The amount (in MiB) of memory to present to the Datadog CWS init container.    |

### FargateLogCollectionFeatureConfig

| Property                       | Type                       | Description                                                                      |
| ------------------------------ | -------------------------- | -------------------------------------------------------------------------------- |
| `isEnabled`                    | `boolean`                  | Enables log collection.                                                          |
| `loggingType`                  | `LoggingType`              | Type of log collection.                                                          |
| `logDriverConfiguration`       | `DatadogECSLogDriverProps` | Configuration for the Datadog log driver.                                        |
| `isLogRouterEssential`         | `boolean`                  | Makes the log router essential.                                                  |
| `isLogRouterDependencyEnabled` | `boolean`                  | Enables the log router health check.                                             |
| `logRouterHealthCheck`         | `HealthCheck`              | Health check configuration for the log router.                                   |
| `cpu`                          | `number`                   | The minimum number of CPU units to reserve for the Datadog fluent-bit container. |
| `memoryLimitMiB`               | `number`                   | The amount (in MiB) of memory to present to the Datadog fluent-bit container.    |

### DatadogECSLogDriverProps

| Property       | Type     | Description                                              |
| -------------- | -------- | -------------------------------------------------------- |
| `registry`     | `string` | The registry to pull the Fluentbit container image from. |
| `imageVersion` | `string` | The version of the Fluentbit container image to use.     |
| `hostEndpoint` | `string` | Host endpoint for Fluentbit.                             |
| `tls`          | `string` | TLS configuration for Fluentbit.                         |
| `compress`     | `string` | Compression configuration for Fluentbit.                 |
| `serviceName`  | `string` | Service name for Fluentbit.                              |
| `sourceName`   | `string` | Source name for Fluentbit.                               |
| `messageKey`   | `string` | Message key for Fluentbit.                               |

### LoggingType Enum

| Value       | Description                                                                     |
| ----------- | ------------------------------------------------------------------------------- |
| `FLUENTBIT` | Forwarding logs to Datadog using Fluentbit container. Only compatible on Linux. |

### Cardinality

| Value          | Description                                             |
| -------------- | ------------------------------------------------------- |
| `LOW`          | Low cardinality.                                        |
| `ORCHESTRATOR` | Orchestrator-level cardinality. (includes task_arn tag) |
| `HIGH`         | High cardinality.                                       |

### Misc

- For configuring logging on windows, you must manually configure the [Datadog Lambda Log Forwarder](https://docs.datadoghq.com/logs/guide/forwarder/?tab=cloudformation). Please follow the instructions defined [here](https://docs.datadoghq.com/integrations/ecs_fargate/?tab=webui#aws-log-driver).

## How it works

The `DatadogECSFargate` construct is designed to simplify the integration of Datadog monitoring into ECS Fargate workloads. It achieves this by managing the Datadog-specific configuration and creating a specialized task definition that extends the AWS ECS `TaskDefinition` class. Here's a breakdown of how it works:

1. **Task Definition Extension**:

   - The construct creates a `DatadogECSFargateTaskDefinition`, which extends the AWS ECS `TaskDefinition` class.
   - This specialized task definition automatically includes the Datadog Agent as a sidecar container, pre-configured with the settings provided in the `DatadogECSFargateProps`.
   - The `DatadogECSFargateTaskDefinition` also supports adding additional containers to the task definition, ensuring that they are properly configured to work alongside the Datadog Agent.

2. **Feature Enablement**:

   - The construct provides granular control over Datadog features, such as:
     - **DogStatsD**: Enables custom metrics collection with configurable cardinality and socket support.
     - **APM**: Enables trace collection with optional Unix Domain Socket support.
     - **CWS**: Adds a security monitoring init container and wraps added container entrypoint.
     - **LogCollection**: Forwards logs to Datadog through the Fluentbit container.
   - These features are enabled or disabled based on the properties provided in the `DatadogECSFargateProps`.

3. **Seamless Integration**:
   - The `DatadogECSFargate` construct abstracts away the complexity of configuring Datadog monitoring for ECS Fargate tasks.
   - Developers can focus on defining their application containers, while the construct handles the creation and configuration of the Datadog Agent and related components.

## Testing

If you contribute to this package you can run the tests using `yarn test`. This package also includes a sample application for manual testing:

1. Open a seperate terminal.
2. Run `yarn watch` to ensure the Typescript files in the `src` directory are compiled to Javascript in the `lib` directory.
3. Navigate to `src/sample/ecs_fargate` and edit `index.ts` to test your contributions manually.
4. At the root directory, run `npx cdk --app lib/sample/ecs_fargate/index.js <CDK Command>`, replacing `<CDK Command>` with common CDK commands like `synth`, `diff`, or `deploy`.

Notes:

- If you receive `... is not authorized to perform: ...` you might also need to authorize the commands with your AWS credentials.
- The first time using CDK, you will need to [cdk boostrap](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) your account.
