import { EcsOptions } from "./common/interfaces";
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Key } from 'aws-cdk-lib/aws-kms';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import {
    LogDrivers,
    ContainerImage,
    Secret as EcsSecret,
    Protocol,
    ContainerDefinition,
    FirelensLogRouterType,
    ContainerDependencyCondition,
    FargateTaskDefinition,
    CfnTaskDefinition
} from 'aws-cdk-lib/aws-ecs'
import { PublicGalleryAuthorizationToken } from "aws-cdk-lib/aws-ecr";
import { Aws, Duration } from "aws-cdk-lib/core";

const addFargateTask = (options: EcsOptions) => { 
    const { ddApiSecretArn, kmsKeyArn } = options;
    const datadogApiSecret =
    options.scope.node.tryFindChild("DatadogApiSecret") as Secret ||
        Secret.fromSecretCompleteArn(options.scope, "DatadogApiSecret", ddApiSecretArn);
    const datadogKmsKey = kmsKeyArn ?
    options.scope.node.tryFindChild("DatadogKmsKey") as Key ||
        Key.fromKeyArn(options.scope, "DatadogKmsKey", kmsKeyArn) : undefined;
    const taskExecutionRole = options.taskDefinition.obtainExecutionRole()
    datadogApiSecret.grantRead(taskExecutionRole);
    !datadogKmsKey || datadogKmsKey.grantDecrypt(taskExecutionRole);
    const datadogEcsSecret = EcsSecret.fromSecretsManager(datadogApiSecret)
    const taskAuxLogGroup = new LogGroup(options.scope, "TaskAuxContainersLogGroup")
    const ddAgentContainer = addDatadogAgentContainer(options, taskAuxLogGroup, datadogEcsSecret);
    const fluentBitContainer = addFluentBitRouter(options, taskAuxLogGroup, datadogEcsSecret)
    ddAgentContainer.addContainerDependencies({
        container: fluentBitContainer,
        condition: ContainerDependencyCondition.HEALTHY
    })
    PublicGalleryAuthorizationToken.grantRead(taskExecutionRole)
}


function addDatadogAgentContainer(containerOptions: EcsOptions, logGroup: LogGroup, ddSecret: EcsSecret): ContainerDefinition {
    const datadogAgentContainer = containerOptions.taskDefinition.addContainer(
        `datadog-agent-${containerOptions.taskDefinition.family}`, { // Adding a suffix to the container name to improve discoverability in infra monitoring
        image: ContainerImage.fromRegistry("public.ecr.aws/datadog/agent:latest"),
        environment: {
            ECS_FARGATE: "true",
            DD_SITE: "datadoghq.com", //TODO: Add option to set this
            DD_DOCKER_LABELS_AS_TAGS: JSON.stringify(containerOptions.tags),
            DD_ENV: containerOptions.envName,
            DD_SERVICE: containerOptions.service,
            DD_VERSION: containerOptions.version,
            DD_TAGS: JSON.stringify(containerOptions.tags), //Setting this as env vars just in case ¯\_(ツ)_/¯ 
        },
        logging: LogDrivers.awsLogs({
            streamPrefix: "datadog-agent",
            logGroup: logGroup
        }),
        secrets: {
            DD_API_KEY: ddSecret
        },
        healthCheck: {
            command: ["agent", "health"],
            startPeriod: Duration.seconds(15)
        },
        portMappings: [
            {
                containerPort: 8125,
                hostPort: 8125,
                protocol: Protocol.TCP
            }
        ]

    });
    return datadogAgentContainer
}

function addFluentBitRouter(options: EcsOptions, logGroup: LogGroup, ddSecret: EcsSecret): ContainerDefinition {

    const fluentBitContainer = options.taskDefinition.addFirelensLogRouter(
        `fluentBit-${options.taskDefinition.family}`, { // Adding a suffix to the container name to improve discoverability in infra monitoring
        image: ContainerImage.fromRegistry("public.ecr.aws/aws-observability/aws-for-fluent-bit:init-latest"),
        healthCheck: {
            command: [
                "echo",
                '\'{"health": "check"}\'',
                "|",
                "nc",
                "127.0.0.1",
                "8877",
                "||",
                "exit 1",
            ],
            startPeriod: Duration.seconds(10),
            retries: 5,
            interval: Duration.seconds(5)
        },
        essential: true,
        firelensConfig: {
            type: FirelensLogRouterType.FLUENTBIT,
        },
        logging: LogDrivers.awsLogs({
            streamPrefix: "fluentbit",
            logGroup: logGroup
        }),
        secrets: { "DD_API_KEY": ddSecret }
    })
    return fluentBitContainer
}

function updateTaskContainers(
    taskDefinition: FargateTaskDefinition,
    ddAgentContainer: ContainerDefinition,
    fluentBitContainer: ContainerDefinition,
    options: EcsOptions
) {
    const cfnTaskDefinition = taskDefinition.node.defaultChild as CfnTaskDefinition
    const taskDefinitionChildren = taskDefinition.node.children
    for (const [index, child] of taskDefinitionChildren.entries()) {
        if (child.constructor.name === ContainerDefinition.name) {
            const container = child as ContainerDefinition
            container.addContainerDependencies(
                {
                    container: ddAgentContainer,
                    condition: ContainerDependencyCondition.HEALTHY
                },
                {
                    container: fluentBitContainer,
                    condition: ContainerDependencyCondition.HEALTHY
                }
            )
            const datadogEnvVars = {
                "DD_ENV": options.envName,
                "DD_SERVICE": options.service,
                "DD_VERSION": options.version || container.imageName,
            }
        
            for (const [key, value] of Object.entries(datadogEnvVars)) {
                container.addEnvironment(key, value)
            }
            cfnTaskDefinition.addPropertyOverride(
                `ContainerDefinitions.${index}.LogConfiguration.Options`,
                {
                    "Name": "datadog",
                    "Host": "http-intake.logs.datadoghq.com",
                    "dd_service": options.service,
                    "dd_source": container.containerName,
                    "dd_message_key": "log",
                    "dd_tags": `env:${options.envName},aws_region:${Aws.REGION}`, //TODO: Add tags from options.tags
                    "TLS": "on",
                    "compress": "gzip",
                    "provider": "ecs",
                }
            )

            cfnTaskDefinition.addPropertyOverride(
                `ContainerDefinitions.${index}.LogConfiguration.SecretOptions`,
                [{"Name": "apikey", "ValueFrom": options.ddApiSecretArn}]
            )

            cfnTaskDefinition.addPropertyOverride(
                `ContainerDefinitions.${index}.DockerLabels`,
                {
                    "com.datadoghq.tags.env": options.envName,
                    "com.datadoghq.tags.service": options.service,
                    "com.datadoghq.tags.version": container.imageName,
                    // TODO: Add tags from options.tags
                }
            )
        }
    }
}