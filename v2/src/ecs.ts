// TODO:

// Update containers with:
//  * environment variables
//  * Docker labels
//  * Log configurations
// Add dependency on Fluentbit and Datadog Agent



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
    ContainerDependencyCondition
} from 'aws-cdk-lib/aws-ecs'
import { PublicGalleryAuthorizationToken } from "aws-cdk-lib/aws-ecr";
import { Duration } from "aws-cdk-lib/core";

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