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
  apiKeySecret: <STRING>,
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
  "ExampleFargateTask",
  {<TASK_DEFINITION_PROPS>}
);
fargateTaskDefinition.addContainer(
  "ContainerName",
  {<CONTAINER_DEFINITION_PROPS>}
)
```

## Configuration

### DatadogECSFargateProps

| Property                     | Type                                | Description                                                                                                   |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `apiKey`                     | `string`                            | The Datadog API key string. Must define at least 1 source for the API key.                                    |
| `apiKeySecret`               | `secrets.ISecret`                   | The Datadog API key secret. Must define at least 1 source for the API key.                                    |
| `apiKeySecretArn`            | `string`                            | The ARN of the Datadog API key secret. Must define at least 1 source for the API key.                         |
| `registry`                   | `string`                            | The registry to pull the Datadog Agent container image from.                                                  |
| `imageVersion`               | `string`                            | The version of the Datadog Agent container image to use.                                                      |
| `cpu`                        | `number`                            | The minimum number of CPU units to reserve for the Datadog Agent container.                                   |
| `memoryLimitMiB`             | `number`                            | The amount (in MiB) of memory to present to the Datadog Agent container.                                      |
| `isDatadogEssential`         | `boolean`                           | Configure Datadog Agent container to be essential for the task.                                               |
| `isDatadogDependencyEnabled` | `boolean`                           | Configure added containers to have container dependency on the Datadog Agent container.                       |
| `datadogHealthCheck`         | `HealthCheck`                       | Configure health check for the Datadog Agent container.                                                       |
| `site`                       | `string`                            | The Datadog site to send data to.                                                                             |
| `clusterName`                | `string`                            | The cluster name to use for tagging.                                                                          |
| `environmentVariables`       | `Record<string, string>`            | Datadog Agent environment variables.                                                                          |
| `globalTags`                 | `string`                            | Global tags to apply to all data sent by the Agent. Overrides any `DD_TAGS` values in `environmentVariables`. |
| `dogstatsd`                  | `DogstatsdFeatureConfig`            | DogStatsD feature configuration.                                                                              |
| `apm`                        | `APMFeatureConfig`                  | APM feature configuration.                                                                                    |
| `cws`                        | `CWSFeatureConfig`                  | CWS feature configuration.                                                                                    |
| `logCollection`              | `FargateLogCollectionFeatureConfig` | Log collection configuration for Fargate.                                                                     |
| `env`                        | `string`                            | The task environment name. Used for tagging (UST).                                                            |
| `service`                    | `string`                            | The task service name. Used for tagging (UST).                                                                |
| `version`                    | `string`                            | The task version. Used for tagging (UST).                                                                     |

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

| Value             | Description                                                                         |
| ----------------- | ----------------------------------------------------------------------------------- |
| `FLUENTBIT`       | Forwarding logs to Datadog using Fluentbit container. Only compatible on Linux.     |
| `LAMBDAFORWARDER` | Currently unsupported within this construct, must configure manually on containers. |

### Cardinality

| Value          | Description                                             |
| -------------- | ------------------------------------------------------- |
| `LOW`          | Low cardinality.                                        |
| `ORCHESTRATOR` | Orchestrator-level cardinality. (includes task_arn tag) |
| `HIGH`         | High cardinality.                                       |

## How it works

The `DatadogECSFargate` construct is designed to simplify the integration of Datadog monitoring into ECS Fargate workloads. It achieves this by managing the Datadog-specific configuration and creating a specialized task definition that extends the AWS ECS `TaskDefinition` class. Here's a breakdown of how it works:

1. **Datadog Configuration Management**:

   - The `DatadogECSFargate` construct acts as a configuration manager for Datadog-specific settings, such as API keys, log collection, APM, DogStatsD, and security monitoring (CWS).
   - It accepts a `DatadogECSFargateProps` object, which defines all the necessary parameters for configuring the Datadog Agent and related features.
   - The construct ensures that the Datadog Agent is properly configured with environment variables, resource limits (CPU and memory), and health checks.

2. **Task Definition Extension**:

   - The construct creates a `DatadogECSFargateTaskDefinition`, which extends the AWS ECS `TaskDefinition` class.
   - This specialized task definition automatically includes the Datadog Agent as a sidecar container, pre-configured with the settings provided in the `DatadogECSFargateProps`.
   - The `DatadogECSFargateTaskDefinition` also supports adding additional containers to the task definition, ensuring that they are properly configured to work alongside the Datadog Agent.

3. **Feature Enablement**:

   - The construct provides granular control over Datadog features, such as:
     - **DogStatsD**: Enables custom metrics collection with configurable cardinality and socket support.
     - **APM**: Enables trace collection with optional Unix Domain Socket support.
     - **CWS**: Adds a security monitoring init container and wraps added container entrypoints.
     - **LogCollection**: Forwards logs to Datadog through the Fluentbit container.
   - These features are enabled or disabled based on the properties provided in the `DatadogECSFargateProps`.

4. **Seamless Integration**:
   - The `DatadogECSFargate` construct abstracts away the complexity of configuring Datadog monitoring for ECS Fargate tasks.
   - Developers can focus on defining their application containers, while the construct handles the creation and configuration of the Datadog Agent and related components.

## Testing

If you contribute to this package you can run the tests using `yarn test`. This package also includes a sample application for manual testing:

1. Open a seperate terminal.
2. Run `yarn watch`, this will ensure the Typescript files in the `src` directory are compiled to Javascript in the `lib` directory.
3. Navigate to `src/sample/ecs_fargate`, here you can edit `index.ts` to test your contributions manually.
4. At the root directory, run `npx cdk --app lib/sample/ecs_fargate/index.js <CDK Command>`, replacing `<CDK Command>` with common CDK commands like `synth`, `diff`, or `deploy`.

- Note, if you receive "... is not authorized to perform: ..." you may also need to authorize the commands with your AWS credentials.

- Note, the first time using CDK, you will need to [boostrap](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) your account.
