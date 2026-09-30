# Datadog ECS Managed Instances Construct

The `DatadogECSManagedInstances` construct deploys the Datadog Agent as an `AWS::ECS::Daemon` on AWS ECS Managed Instances. It creates and configures the daemon task definition (and, optionally, the daemon itself) so the Agent runs once per instance and collects metrics, traces, and DogStatsD data for the workloads on that instance.

## Installation

To use the `DatadogECSManagedInstances` construct, install the `datadog-cdk-constructs-v2` package:

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

### TypeScript

```typescript
const ecsDatadog = new DatadogECSManagedInstances({
  // One of the following 4 apiKey params are required
  apiKey: <STRING>,
  apiKeySecret: <SECRET>,
  apiKeySecretArn: <STRING>,
  apiKeySsmArn: <STRING>,
  family: <STRING>,
  registry: <STRING>,
  imageVersion: <STRING>,
  taskCpu: <STRING>,
  taskMemory: <STRING>,
  site: <STRING>,
  environmentVariables: <RECORD<STRING, STRING>>,
  globalTags: <STRING>,
  dogstatsd: <DOGSTATSD_FEATURE_CONFIG>,
  apm: <APM_FEATURE_CONFIG>,
  networkMonitoring: <NETWORK_MONITORING_FEATURE_CONFIG>,
  processCollection: <PROCESS_COLLECTION_FEATURE_CONFIG>,
  createDaemon: <BOOLEAN>,
  clusterArn: <STRING>,
  capacityProviderArns: <STRING[]>,
  env: <STRING>,
  service: <STRING>,
  version: <STRING>,
});
const daemonTaskDefinition = ecsDatadog.daemonTaskDefinition(
  this,
  "DatadogTypescriptDaemon",
  {<DATADOG_ECS_MANAGED_INSTANCES_PROPS>}, // optional override values
);

// Or create the daemon task definition directly
const daemonTaskDefinition2 = new DatadogECSManagedInstancesDaemonTaskDefinition(
  this,
  "DatadogTypescriptDaemon2",
  {
    family: <STRING>,
    apiKeySecret: <SECRET>,
    ...
  },
)
```

### Python

```python
ecsDatadog = DatadogECSManagedInstances(
    api_key=os.getenv("DD_API_KEY"),
    family=str,
    dogstatsd={
        "is_origin_detection_enabled": bool,
    },
    global_tags=str,
    ...
)
daemon_task_definition = ecsDatadog.daemon_task_definition(
  self,
  "DatadogPythonDaemon",
  # optional: datadog_props=DatadogECSManagedInstancesProps(...)
)
```

### Golang

```golang
datadog := ddcdkconstruct.NewDatadogECSManagedInstances(
  &ddcdkconstruct.DatadogECSManagedInstancesProps{
    ApiKey: jsii.String(os.Getenv("DD_API_KEY")),
    Family: jsii.String(string),
  },
)
daemonTaskDefinition := datadog.DaemonTaskDefinition(
  stack,
  jsii.String("DatadogGolangDaemon"),
  // optional: &ddcdkconstruct.DatadogECSManagedInstancesProps{},
)
```

## Configuration

For more general information, reference the [Datadog ECS Managed Instances Docs](https://docs.datadoghq.com/integrations/ecs_fargate/). Custom configuration of the Datadog Agent is supported via the `environmentVariables` field of the props. The Datadog Agent container definition is available as a property of the `taskDefinition` object for further inspection. However, we recommend using the pre-defined configuration options within the interfaces when possible.

### DatadogECSManagedInstancesProps

| Property                | Type                                   | Description                                                                                                                                                                             |
| ------------------------ | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apiKey`                 | `string`                                | The Datadog API key string. Must define at least 1 source for the API key.                                                                                                              |
| `apiKeySecret`           | `secrets.ISecret`                       | The Datadog API key secret. Must define at least 1 source for the API key.                                                                                                              |
| `apiKeySecretArn`        | `string`                                | The ARN of the Datadog API key secret. Must define at least 1 source for the API key.                                                                                                   |
| `apiKeySsmArn`           | `string`                                | The ARN or name of the parameter storing the Datadog API key in SSM Parameter Store. Must define at least 1 source for the API key.                                                     |
| `registry`               | `string`                                | The registry to pull the Datadog Agent container image from.                                                                                                                            |
| `imageVersion`           | `string`                                | The version of the Datadog Agent container image to use.                                                                                                                                |
| `cpu`                    | `number`                                | The minimum number of CPU units to reserve for the Datadog Agent container.                                                                                                             |
| `memoryLimitMiB`         | `number`                                | The amount (in MiB) of memory to present to the Datadog Agent container.                                                                                                                |
| `isDatadogEssential`     | `boolean`                                | Configure Datadog Agent container to be essential for the task.                                                                                                                         |
| `readOnlyRootFilesystem` | `boolean`                                | Configure Datadog Agent container to run with read-only root filesystem enabled.                                                                                                        |
| `datadogHealthCheck`     | `HealthCheck`                           | Configure health check for the Datadog Agent container.                                                                                                                                 |
| `site`                   | `string`                                | The Datadog site to send data to.                                                                                                                                                       |
| `clusterName`            | `string`                                | The cluster name to use for tagging.                                                                                                                                                    |
| `environmentVariables`   | `Record<string, string>`                | Datadog Agent environment variables. Used to customize your Datadog Agent configuration.                                                                                                |
| `globalTags`             | `string`                                | Global tags to apply to all data sent by the Agent. Overrides any `DD_TAGS` values in `environmentVariables`.                                                                            |
| `checksCardinality`      | `Cardinality`                           | The tag cardinality for checks run by the Agent.                                                                                                                                        |
| `dogstatsd`              | `DogstatsdFeatureConfig`                | DogStatsD feature configuration.                                                                                                                                                         |
| `apm`                    | `APMFeatureConfig`                      | APM feature configuration.                                                                                                                                                              |
| `env`                    | `string`                                | The task environment name. Used for tagging (UST).                                                                                                                                      |
| `service`                | `string`                                | The task service name. Used for tagging (UST).                                                                                                                                          |
| `version`                | `string`                                | The task version. Used for tagging (UST).                                                                                                                                               |
| `family`                 | `string`                                | A unique name for the daemon task definition family.                                                                                                                                    |
| `taskCpu`                | `string`                                | Number of cpu units used by the daemon task, as a string (e.g. `"256"`).                                                                                                                |
| `taskMemory`             | `string`                                | Amount (in MiB) of memory used by the daemon task, as a string (e.g. `"512"`).                                                                                                          |
| `taskRole`               | `iam.IRole`                             | The IAM role that allows the Datadog Agent container to make calls to other AWS services. Created automatically if not provided.                                                       |
| `executionRole`          | `iam.IRole`                             | The IAM role that grants the Amazon ECS container agent permission to make AWS API calls. Created automatically if not provided.                                                       |
| `volumes`                | `ManagedInstancesVolume[]`              | Additional host-path volumes to add to the daemon task, beyond the ones this construct manages (containerd socket, `/proc`, `/sys/fs/cgroup`, UDS sockets, network monitoring debug mount). |
| `logCollection`          | `LogCollectionFeatureConfig`            | Log collection is not supported for the Datadog Agent running as an ECS Managed Daemon. Setting `isEnabled: true` here causes construct validation to fail.                            |
| `networkMonitoring`      | `NetworkMonitoringFeatureConfig`        | Configuration for Datadog Cloud Network Monitoring. Linux only.                                                                                                                         |
| `processCollection`      | `ProcessCollectionFeatureConfig`        | Configuration for Datadog Live Process collection.                                                                                                                                      |
| `agentLogConfiguration`  | `ManagedInstancesLogConfiguration`      | Log configuration for the Datadog Agent container's own logs (not application container logs), e.g. routing to CloudWatch via the `awslogs` driver.                                    |
| `criSocketPath`          | `string`                                | Path to the containerd socket on the host. ECS Managed Instances uses containerd, not Docker. Default: `/var/run/containerd/containerd.sock`.                                          |
| `procPath`               | `string`                                | Path to the `/proc` directory on the host. Default: `/proc/`.                                                                                                                           |
| `cgroupPath`             | `string`                                | Path to the cgroup directory on the host. Default: `/sys/fs/cgroup/`.                                                                                                                   |
| `pidMode`                | `string`                                | The PID namespace mode for the daemon task.                                                                                                                                             |
| `ipcMode`                | `string`                                | The IPC namespace mode for the daemon task.                                                                                                                                             |
| `createDaemon`           | `boolean`                                | Whether to create the `AWS::ECS::Daemon` resource. If false, only the daemon task definition is created. Default: `true`.                                                              |
| `clusterArn`             | `string`                                | ARN of the ECS cluster where the Datadog Agent daemon will run. Required if `createDaemon` is true.                                                                                     |
| `capacityProviderArns`   | `string[]`                              | ARNs of ECS Managed Instances capacity providers the daemon should run on. Required if `createDaemon` is true. This construct does not create the capacity provider, infrastructure role, or instance profile; those must already exist. |
| `daemonName`             | `string`                                | Name of the ECS daemon. Default: `` `${family}-datadog-agent` ``.                                                                                                                       |
| `propagateTags`          | `string`                                | Propagate tags to daemon tasks. Default: `"DAEMON"`.                                                                                                                                     |
| `enableEcsManagedTags`   | `boolean`                                | Enable ECS managed tags for the daemon. Default: `true`.                                                                                                                                |
| `enableExecuteCommand`   | `boolean`                                | Enable ECS Exec for daemon tasks. Default: `false`.                                                                                                                                     |
| `deploymentConfiguration`| `DeploymentConfiguration`               | Controls the daemon's rolling deployment behavior across instances. See [Deployment Behavior](#deployment-behavior).                                                                    |
| `tags`                   | `Record<string, string>`                | A map of additional tags to add to the daemon task definition/daemon created.                                                                                                           |

### NetworkMonitoringFeatureConfig

| Property    | Type      | Description                                     |
| ----------- | --------- | ------------------------------------------------ |
| `isEnabled` | `boolean` | Enables Cloud Network Monitoring. Linux only.    |

### ProcessCollectionFeatureConfig

| Property    | Type      | Description                        |
| ----------- | --------- | ------------------------------------ |
| `isEnabled` | `boolean` | Enables Live Process Collection.   |

### ManagedInstancesLogConfiguration

| Property        | Type                              | Description                                                        |
| ---------------- | ---------------------------------- | --------------------------------------------------------------------- |
| `logDriver`      | `string`                           | The log driver to use for the Datadog Agent container's own logs. |
| `options`        | `Record<string, string>`           | Log driver options.                                                |
| `secretOptions`  | `ManagedInstancesLogSecretOption[]`| Secrets to pass to the log driver.                                 |

### DeploymentConfiguration

| Property             | Type                         | Description                                                                                          |
| --------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| `drainPercent`        | `number`                     | The percentage of instances to drain simultaneously during a daemon deployment. Default: `25`.       |
| `bakeTimeInMinutes`   | `number`                     | The amount of time (in minutes) to wait after a successful deployment step before proceeding. Default: `0`. |
| `alarms`              | `DeploymentAlarmConfiguration` | CloudWatch alarm configuration for the daemon deployment.                                            |

### DeploymentAlarmConfiguration

| Property     | Type       | Description                                                                                  |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------ |
| `alarmNames` | `string[]` | The CloudWatch alarm names to monitor during a daemon deployment. Default: `[]`.             |
| `enable`     | `boolean`  | Determines whether to use the CloudWatch alarm option in the daemon deployment process. Default: `false`. |

### ManagedInstancesVolume

| Property  | Type     | Description                                    |
| ---------- | -------- | ------------------------------------------------- |
| `name`    | `string` | The volume name.                               |
| `hostPath`| `string` | The host source path for the volume, if any.   |

## Deployment Behavior

The `AWS::ECS::DaemonTaskDefinition` and `AWS::ECS::Daemon` resources behave differently from a standard ECS service, and both differences affect how you plan changes to this construct:

- Any change to the daemon task definition, including a container image tag, forces AWS to replace the daemon task definition. The daemon deployment model then drains and replaces every EC2 instance in the attached capacity provider(s), one batch at a time as controlled by `deploymentConfiguration`. Plan daemon updates as a fleet-wide instance replacement, not an in-place container swap.
- The `deploymentConfiguration` block on `AWS::ECS::Daemon` is write-only: AWS does not return it from the API. `cdk diff` shows a diff on this block on every run. This is expected and does not indicate drift.
- `AWS::ECS::Daemon` marks the daemon container `critical` with no way to opt out through CloudFormation. If the Datadog Agent's health check fails, AWS drains and replaces the underlying EC2 instance. The construct's default `datadogHealthCheck` is Datadog's documented health check command for this deployment mode, chosen to minimize the chance of a false positive triggering an instance replacement.

## Misc

- Log collection for application containers is not supported when the Datadog Agent runs as an ECS Managed Daemon. Use the FireLens log driver or the `awslogs` driver configured directly on your application task definition instead. Setting `logCollection.isEnabled` to `true` fails construct validation.
- When DogStatsD or APM is enabled without Unix Domain Socket support, application containers reach the Agent over TCP at a static daemon bridge IP, since daemons on an ECS Managed Instance share a single network namespace. Use a Datadog client library to send this traffic; a hand-rolled socket sender cannot populate origin detection, which depends on the client embedding the container ID in the payload.
- Only attach one Datadog Agent daemon per capacity provider. Every daemon attached to a capacity provider runs on every instance in it, sharing that instance's network namespace, so two Datadog Agent daemons on the same capacity provider (for example, while migrating from another deployment of this module) collide on fixed host resources: the DogStatsD port (8125), the Agent's internal API port (5001), and the UDS socket paths under `/var/run/datadog`. Fully remove one daemon before attaching another to the same capacity provider.
- This deployment mode requires Datadog Agent version 7.77.0 or later.
- The daemon task definition's container array is set once at construction instead of being built incrementally with `addContainer` as in the Fargate module. A daemon task holds exactly one container, so this is inherent to the deployment model rather than a limitation. Application containers belong in their own, separate task definitions; do not expect to add them to the daemon task definition returned by this construct.
- Data Streams Monitoring (`apm.dataStreams`) is an application/tracer-side feature, not an Agent-side one. Setting it adds `DD_DATA_STREAMS_ENABLED` to `dataStreamsEnvironment`; add that environment variable to the application container that produces or consumes messages (Kafka, SQS, Kinesis, SNS, RabbitMQ, etc.), the same way you add `dogstatsdEnvironment`/`apmEnvironment`. Setting `apm.dataStreams` alone has no effect on the Datadog Agent container.

## How it works

The `DatadogECSManagedInstances` construct manages the Datadog-specific configuration for the Datadog Agent running as an ECS Managed Daemon. Here's a breakdown of how it works:

1. **Daemon Task Definition**:

   - The construct creates a `DatadogECSManagedInstancesDaemonTaskDefinition`, which wraps an `AWS::ECS::DaemonTaskDefinition` CloudFormation resource.
   - Unlike `DatadogECSFargateTaskDefinition`, this construct does not extend an AWS CDK L2 task definition class, since `AWS::ECS::DaemonTaskDefinition` has no L2 equivalent.
   - The task definition mounts the host's containerd socket, `/proc`, and cgroup directories so the Agent can collect metrics from every container on the instance.

2. **Daemon Resource**:

   - Unless `createDaemon` is `false`, the construct also creates an `AWS::ECS::Daemon` resource that attaches the task definition to the ECS cluster and capacity provider(s) you specify.
   - Set `createDaemon` to `false` to create only the task definition, for example when a separate process manages the daemon resource.

3. **Feature Enablement**:

   - The construct provides granular control over Datadog features, such as:
     - **DogStatsD**: Enables custom metrics collection, over a shared UDS socket volume or TCP against the daemon bridge IP.
     - **APM**: Enables trace collection, over the same UDS socket volume or TCP.
     - **Cloud Network Monitoring**: Adds the Linux capabilities and host mount the Agent needs for network monitoring.
     - **Live Process Collection**: Enables process-level telemetry from the host.
   - These features are enabled or disabled based on the properties provided in `DatadogECSManagedInstancesProps`.

4. **Wiring Application Containers**:
   - Application containers run in their own task definitions. The construct exposes `appDdSocketsVolume` and `appDdSocketsMountPoint` for wiring an application container to the Agent over UDS, and `dogstatsdEnvironment`/`apmEnvironment`/`dataStreamsEnvironment` for the corresponding environment variables.

## Testing

If you contribute to this package you can run the tests using `yarn test test/ecs/managed-instances`.

Notes:

- If you receive `... is not authorized to perform: ...` you might also need to authorize the commands with your AWS credentials.
- The first time using CDK, you will need to [cdk boostrap](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) your account.
