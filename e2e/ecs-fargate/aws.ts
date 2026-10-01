/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

import assert from "node:assert/strict";
import { APP_CONTAINER_PORT, REGION, RETRY_PATTERNS, type ResolvedNetwork } from "./config";
import { execPromiseWithRetries } from "../helpers/exec";

const AGENT_CONTAINER_NAME = "datadog-agent";

// The Agent's own health check starts after 60 seconds and gives up after three failures 10 seconds
// apart, so four minutes covers both outcomes with room for a slow start.
const AGENT_HEALTH_ATTEMPTS = 12;
const AGENT_HEALTH_INTERVAL_SECONDS = 20;
const SERVICE_REMOVAL_ATTEMPTS = 20;
const SERVICE_REMOVAL_INTERVAL_SECONDS = 15;

const waitFor = (seconds: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

/** Runs an AWS CLI read and parses its `--output json` response, typed by the caller that reads it. */
const awsJson = async <T>(command: string): Promise<T> => {
  const result = await execPromiseWithRetries(`aws ${command} --region "${REGION}" --output json`, {
    logOutput: false,
    retryPatterns: RETRY_PATTERNS,
  });
  assert.equal(result.exitCode, 0, `aws ${command} failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout) as T;
};

const quoted = (values: string[]): string => values.map((value) => `"${value}"`).join(" ");

export const resolveNetwork = async (subnetIds: string[]): Promise<ResolvedNetwork> => {
  const { Subnets = [] } = await awsJson<{
    Subnets?: { SubnetId: string; VpcId: string; AvailabilityZone: string }[];
  }>(`ec2 describe-subnets --subnet-ids ${quoted(subnetIds)}`);
  const vpcIds = [...new Set(Subnets.map(({ VpcId }) => VpcId))];
  assert.equal(vpcIds.length, 1, `AWS_ECS_SUBNETS must belong to one VPC, got ${vpcIds.join(", ") || "none"}`);

  return {
    vpcId: vpcIds[0],
    subnets: Subnets.map(({ SubnetId, AvailabilityZone }) => ({
      subnetId: SubnetId,
      availabilityZone: AvailabilityZone,
    })),
  };
};

export interface ContainerDefinition {
  name: string;
  image: string;
  essential?: boolean;
  user?: string;
  entryPoint?: string[];
  command?: string[];
  environment?: { name: string; value: string }[];
  secrets?: { name: string; valueFrom: string }[];
  dockerLabels?: Record<string, string>;
  mountPoints?: { sourceVolume: string; containerPath: string; readOnly?: boolean }[];
  dependsOn?: { containerName: string; condition: string }[];
  healthCheck?: { command: string[] };
  firelensConfiguration?: { type: string; options?: Record<string, string> };
  logConfiguration?: {
    logDriver: string;
    options?: Record<string, string>;
    secretOptions?: { name: string; valueFrom: string }[];
  };
}

export interface DescribedTaskDefinition {
  family: string;
  revision: number;
  taskDefinitionArn: string;
  containerDefinitions: ContainerDefinition[];
  volumes: { name: string }[];
  tags: Record<string, string>;
}

/** Describes a task definition by ARN, `family:revision`, or family (its latest active revision). */
export const describeTaskDefinition = async (taskDefinition: string): Promise<DescribedTaskDefinition> => {
  const described = await awsJson<{
    taskDefinition: Omit<DescribedTaskDefinition, "volumes" | "tags"> & { volumes?: { name: string }[] };
    tags?: { key: string; value: string }[];
  }>(`ecs describe-task-definition --task-definition "${taskDefinition}" --include TAGS`);

  return {
    ...described.taskDefinition,
    volumes: described.taskDefinition.volumes ?? [],
    tags: Object.fromEntries((described.tags ?? []).map(({ key, value }) => [key, value])),
  };
};

/** The active revisions of one family, oldest first. */
export const activeRevisions = async (family: string): Promise<string[]> => {
  const { taskDefinitionArns = [] } = await awsJson<{ taskDefinitionArns?: string[] }>(
    `ecs list-task-definitions --family-prefix "${family}" --status ACTIVE`,
  );
  // `--family-prefix` is a prefix match, and the language families extend the service family.
  return taskDefinitionArns.filter((arn) => arn.split("/").pop()?.split(":")[0] === family);
};

export interface ServiceState {
  /** `ACTIVE`, `DRAINING`, `INACTIVE`, or `MISSING` once ECS no longer reports the service. */
  status: string;
  taskDefinition?: string;
}

export const describeService = async (cluster: string, serviceName: string): Promise<ServiceState> => {
  const { services = [] } = await awsJson<{ services?: { status: string; taskDefinition: string }[] }>(
    `ecs describe-services --cluster "${cluster}" --services "${serviceName}"`,
  );
  const [service] = services;

  return service ? { status: service.status, taskDefinition: service.taskDefinition } : { status: "MISSING" };
};

/** Waits until a deleted service stops draining. */
export const waitForServiceRemoved = async (cluster: string, serviceName: string): Promise<void> => {
  let status = "";
  for (let attempt = 1; attempt <= SERVICE_REMOVAL_ATTEMPTS; attempt++) {
    ({ status } = await describeService(cluster, serviceName));
    if (status === "INACTIVE" || status === "MISSING") {
      return;
    }
    if (attempt < SERVICE_REMOVAL_ATTEMPTS) {
      await waitFor(SERVICE_REMOVAL_INTERVAL_SECONDS);
    }
  }
  assert.fail(`ECS service ${serviceName} is still ${status} after remove`);
};

interface DescribedTask {
  taskArn: string;
  taskDefinitionArn: string;
  containers?: { name: string; healthStatus?: string }[];
  attachments?: { details?: { name: string; value: string }[] }[];
}

/** The service's running tasks of one revision, so a task the deployment replaced is never read. */
const runningTasks = async (
  cluster: string,
  serviceName: string,
  taskDefinitionArn: string,
): Promise<DescribedTask[]> => {
  const { taskArns = [] } = await awsJson<{ taskArns?: string[] }>(
    `ecs list-tasks --cluster "${cluster}" --service-name "${serviceName}" --desired-status RUNNING`,
  );
  if (taskArns.length === 0) {
    return [];
  }

  const { tasks = [] } = await awsJson<{ tasks?: DescribedTask[] }>(
    `ecs describe-tasks --cluster "${cluster}" --tasks ${quoted(taskArns)}`,
  );
  return tasks.filter((task) => task.taskDefinitionArn === taskDefinitionArn);
};

/** Waits for the Agent sidecar of every running task of the revision to pass its health check. */
export const waitForAgentHealthy = async (
  cluster: string,
  serviceName: string,
  taskDefinitionArn: string,
): Promise<void> => {
  for (let attempt = 1; attempt <= AGENT_HEALTH_ATTEMPTS; attempt++) {
    const statuses = (await runningTasks(cluster, serviceName, taskDefinitionArn))
      .map((task) => task.containers?.find(({ name }) => name === AGENT_CONTAINER_NAME)?.healthStatus)
      .filter((status): status is string => status !== undefined);
    console.log(`[agent health] attempt ${attempt}/${AGENT_HEALTH_ATTEMPTS}: ${statuses.join(", ") || "no Agent yet"}`);

    if (statuses.length > 0 && statuses.every((status) => status === "HEALTHY")) {
      return;
    }
    if (statuses.includes("UNHEALTHY")) {
      assert.fail(
        `The ${AGENT_CONTAINER_NAME} container of ${serviceName} failed its health check, so no telemetry will arrive. ` +
          "This may be caused by an unusable API key: check that AWS_ECS_API_KEY_SECRET_ARN holds the right key",
      );
    }
    if (attempt < AGENT_HEALTH_ATTEMPTS) {
      await waitFor(AGENT_HEALTH_INTERVAL_SECONDS);
    }
  }
  assert.fail(
    `The ${AGENT_CONTAINER_NAME} container of ${serviceName} did not report healthy after ` +
      `${AGENT_HEALTH_ATTEMPTS * AGENT_HEALTH_INTERVAL_SECONDS}s`,
  );
};

/** The public address of the service's running task of the revision. */
export const taskUrl = async (cluster: string, serviceName: string, taskDefinitionArn: string): Promise<string> => {
  const [task] = await runningTasks(cluster, serviceName, taskDefinitionArn);
  assert.ok(task, `ECS service ${serviceName} runs no task of ${taskDefinitionArn}`);

  const networkInterfaceId = task.attachments?.[0]?.details?.find(({ name }) => name === "networkInterfaceId")?.value;
  assert.ok(networkInterfaceId, `Task ${task.taskArn} has no elastic network interface`);

  const { NetworkInterfaces = [] } = await awsJson<{ NetworkInterfaces?: { Association?: { PublicIp?: string } }[] }>(
    `ec2 describe-network-interfaces --network-interface-ids "${networkInterfaceId}"`,
  );
  const publicIp = NetworkInterfaces[0]?.Association?.PublicIp;
  assert.ok(publicIp, `Network interface ${networkInterfaceId} has no public IP`);

  return `http://${publicIp}:${APP_CONTAINER_PORT}`;
};
