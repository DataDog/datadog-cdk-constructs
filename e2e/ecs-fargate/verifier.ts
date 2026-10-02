/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

import assert from "node:assert/strict";
import { type ContainerDefinition, type DescribedTaskDefinition, activeRevisions, waitForServiceRemoved } from "./aws";
import { APP_CONTAINER_NAME, type SsiCase } from "./config";
import { FRESHNESS_TAG_KEY, RUN_ID_TAG_KEY } from "../helpers/naming";

// What the construct writes, restated rather than imported from src/ so that renaming one on the
// construct side fails the suite instead of passing along with it.
const AGENT_CONTAINER_NAME = "datadog-agent";
const LOG_ROUTER_CONTAINER_NAME = "datadog-log-router";
const TRACER_CONTAINER_NAME = "datadog-tracer";
const AGENT_IMAGE = "public.ecr.aws/datadog/agent:latest";
const LOG_ROUTER_IMAGE = "public.ecr.aws/aws-observability/aws-for-fluent-bit:stable";
const TRACER_REGISTRY = "public.ecr.aws/datadog";

const AGENT_SOCKET_VOLUME_NAME = "dd-sockets";
const AGENT_SOCKET_MOUNT_PATH = "/var/run/datadog";
const TRACER_VOLUME_NAME = "datadog-tracer";
const TRACER_MOUNT_PATH = "/datadog-lib";
const TRACER_COPY_ENTRYPOINT = "/datadog-init/copy-lib.sh";

const INJECTION_MODE_DD_TAG = "_dd.injection.mode:serverless-single-lang";
const CDK_CONSTRUCT_TAG = "dd_cdk_construct";
const SSI_INJECTION_MODE_TAG = "dd_sls_injection_mode";

const DOCKER_LABEL_SERVICE = "com.datadoghq.tags.service";
const DOCKER_LABEL_ENV = "com.datadoghq.tags.env";
const DOCKER_LABEL_VERSION = "com.datadoghq.tags.version";

const containerNamed = (taskDefinition: DescribedTaskDefinition, name: string): ContainerDefinition => {
  const container = taskDefinition.containerDefinitions.find((candidate) => candidate.name === name);
  assert.ok(container, `${taskDefinition.family} has no ${name} container`);
  return container;
};

const envByName = (container: ContainerDefinition): Record<string, string> =>
  Object.fromEntries((container.environment ?? []).map(({ name, value }) => [name, value]));

const mountPathsOf = (container: ContainerDefinition, sourceVolume: string): string[] =>
  (container.mountPoints ?? [])
    .filter((mount) => mount.sourceVolume === sourceVolume)
    .map(({ containerPath }) => containerPath);

const hasVolume = (taskDefinition: DescribedTaskDefinition, name: string): boolean =>
  taskDefinition.volumes.some((volume) => volume.name === name);

const tagList = (tags: string | undefined): string[] => (tags ?? "").split(",").map((tag) => tag.trim());

export interface ServiceExpectation {
  service: string;
  env: string;
  version: string;
  site: string;
  runId: string;
  createdTs: string;
  apiKey: string;
}

/**
 * The Agent sidecar, the socket transport, the unified service tags, the API key, and the
 * tags the construct and the suite stamp on the revision.
 */
export const verifyServiceInstrumented = (
  taskDefinition: DescribedTaskDefinition,
  { service, env, version, site, runId, createdTs, apiKey }: ServiceExpectation,
): void => {
  const agent = containerNamed(taskDefinition, AGENT_CONTAINER_NAME);
  assert.equal(agent.image, AGENT_IMAGE);
  // A crashed Agent must cost telemetry, not availability.
  assert.equal(agent.essential, false, "the Agent container must not be essential");
  assert.deepEqual(agent.healthCheck?.command, ["CMD-SHELL", "/probe.sh"]);

  const agentEnv = envByName(agent);
  assert.equal(agentEnv.ECS_FARGATE, "true");
  assert.equal(agentEnv.DD_SITE, site);
  assert.equal(agentEnv.DD_SERVICE, service);
  assert.equal(agentEnv.DD_ENV, env);
  assert.equal(agentEnv.DD_VERSION, version);
  assert.equal(agentEnv.DD_ECS_TASK_COLLECTION_ENABLED, "true");
  assert.equal(agentEnv.DD_DOGSTATSD_TAG_CARDINALITY, "orchestrator");

  const app = containerNamed(taskDefinition, APP_CONTAINER_NAME);
  const appEnv = envByName(app);
  assert.equal(appEnv.DD_SERVICE, service);
  assert.equal(appEnv.DD_ENV, env);
  assert.equal(appEnv.DD_VERSION, version);
  assert.equal(appEnv.DD_API_KEY, undefined, "only the Agent may hold the API key");
  assert.ok(
    tagList(appEnv.DD_TAGS).includes(`${RUN_ID_TAG_KEY}:${runId}`),
    `DD_TAGS = ${JSON.stringify(appEnv.DD_TAGS)} lost the run id tag the application declared`,
  );

  // The tracer and the Agent must agree on the transport: both ends of the socket, or neither.
  assert.equal(appEnv.DD_TRACE_AGENT_URL, `unix://${AGENT_SOCKET_MOUNT_PATH}/apm.socket`);
  assert.equal(appEnv.DD_DOGSTATSD_URL, `unix://${AGENT_SOCKET_MOUNT_PATH}/dsd.socket`);
  assert.equal(appEnv.DD_AGENT_HOST, undefined);
  assert.ok(hasVolume(taskDefinition, AGENT_SOCKET_VOLUME_NAME), `missing volume ${AGENT_SOCKET_VOLUME_NAME}`);
  assert.deepEqual(mountPathsOf(app, AGENT_SOCKET_VOLUME_NAME), [AGENT_SOCKET_MOUNT_PATH]);
  assert.deepEqual(mountPathsOf(agent, AGENT_SOCKET_VOLUME_NAME), [AGENT_SOCKET_MOUNT_PATH]);

  // The labels tag what the Agent observes from outside the container, as the environment tags what
  // the tracer inside it sends. The Agent is unlabeled, so it reports as itself.
  assert.equal(app.dockerLabels?.[DOCKER_LABEL_SERVICE], service);
  assert.equal(app.dockerLabels?.[DOCKER_LABEL_ENV], env);
  assert.equal(app.dockerLabels?.[DOCKER_LABEL_VERSION], version);
  assert.equal(agent.dockerLabels?.[DOCKER_LABEL_SERVICE], undefined);

  assert.match(taskDefinition.tags[CDK_CONSTRUCT_TAG] ?? "", /^v\d+\.\d+\.\d+/, `${CDK_CONSTRUCT_TAG} tag`);
  assert.equal(taskDefinition.tags[FRESHNESS_TAG_KEY], createdTs, `${FRESHNESS_TAG_KEY} tag`);
  assert.equal(taskDefinition.tags[RUN_ID_TAG_KEY], runId, `${RUN_ID_TAG_KEY} tag`);
};

export interface LogCollectionExpectation {
  service: string;
  runId: string;
  apiKey: string;
}

/** The FireLens router, every other container routed through it, and the application's log identity. */
export const verifyLogCollection = (
  taskDefinition: DescribedTaskDefinition,
  { service, runId, apiKey }: LogCollectionExpectation,
): void => {
  const router = containerNamed(taskDefinition, LOG_ROUTER_CONTAINER_NAME);
  assert.equal(router.image, LOG_ROUTER_IMAGE);
  assert.equal(router.essential, false, "the log router must not be essential");
  assert.equal(router.firelensConfiguration?.type, "fluentbit");

  for (const container of taskDefinition.containerDefinitions) {
    if (container.name === LOG_ROUTER_CONTAINER_NAME) {
      continue;
    }
    const logConfiguration = container.logConfiguration;
    assert.equal(logConfiguration?.logDriver, "awsfirelens", `${container.name} logs bypass the log router`);
    assert.equal(logConfiguration?.options?.Name, "datadog");
    assert.equal(logConfiguration?.options?.provider, "ecs");
    assert.equal(
      logConfiguration?.options?.apikey === apiKey,
      true,
      `${container.name} log driver must use the suite API key`,
    );
    assert.equal(
      logConfiguration?.secretOptions?.some(({ name }) => name === "apikey") ?? false,
      false,
      `${container.name} log driver must not read the API key from a secret`,
    );
  }

  const appOptions = containerNamed(taskDefinition, APP_CONTAINER_NAME).logConfiguration?.options ?? {};
  assert.equal(appOptions.dd_service, service);
  assert.ok(tagList(appOptions.dd_tags).includes(`${RUN_ID_TAG_KEY}:${runId}`), "application logs lack the run id tag");
};

/**
 * The tracer container, the volume it copies into, and the startup environment that makes the
 * application container load what was copied.
 */
export const verifySsiInstrumented = (taskDefinition: DescribedTaskDefinition, ssiCase: SsiCase): void => {
  const tracer = containerNamed(taskDefinition, TRACER_CONTAINER_NAME);
  assert.equal(tracer.image, `${TRACER_REGISTRY}/dd-lib-${ssiCase.tracerRepository}-init:latest`);
  // The copy runs to completion and exits, so it must not be able to fail the task.
  assert.equal(tracer.essential, false, "the tracer container must not be essential");
  assert.equal(tracer.user, "0");
  assert.deepEqual(tracer.entryPoint, [TRACER_COPY_ENTRYPOINT]);
  assert.deepEqual(tracer.command, [TRACER_MOUNT_PATH]);
  assert.deepEqual(mountPathsOf(tracer, TRACER_VOLUME_NAME), [TRACER_MOUNT_PATH]);
  assert.ok(hasVolume(taskDefinition, TRACER_VOLUME_NAME), `missing volume ${TRACER_VOLUME_NAME}`);

  // Only the application container loads the tracer; the Agent must not.
  const app = containerNamed(taskDefinition, APP_CONTAINER_NAME);
  assert.deepEqual(mountPathsOf(app, TRACER_VOLUME_NAME), [TRACER_MOUNT_PATH]);
  assert.ok(
    app.dependsOn?.some(
      ({ containerName, condition }) => containerName === TRACER_CONTAINER_NAME && condition === "SUCCESS",
    ),
    "the application container must start after the tracer copy succeeds",
  );
  const agent = containerNamed(taskDefinition, AGENT_CONTAINER_NAME);
  assert.deepEqual(mountPathsOf(agent, TRACER_VOLUME_NAME), []);

  const { name, value } = ssiCase.nativeEnv;
  const appEnv = envByName(app);
  assert.ok(
    (appEnv[name] ?? "").includes(value),
    `${name} = ${JSON.stringify(appEnv[name])}, want it to include ${value}`,
  );
  assert.equal(envByName(agent)[name], undefined, `the Agent container must not load the tracer through ${name}`);
  assert.ok(tagList(appEnv.DD_TAGS).includes(INJECTION_MODE_DD_TAG), `DD_TAGS lacks ${INJECTION_MODE_DD_TAG}`);

  assert.equal(taskDefinition.tags[SSI_INJECTION_MODE_TAG], "single_language", `${SSI_INJECTION_MODE_TAG} tag`);
};

/** Nothing the stack deployed is left running or registered. */
export const verifyRemoved = async (cluster: string, serviceName: string, families: string[]): Promise<void> => {
  await waitForServiceRemoved(cluster, serviceName);
  for (const family of families) {
    assert.deepEqual(await activeRevisions(family), [], `${family} still has active revisions after remove`);
  }
};
