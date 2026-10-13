/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import log from "loglevel";
import { ManagedContainerPaths, ManagedVolumeNames } from "./constants";
import { DatadogECSManagedInstancesProps } from "./interfaces";
import { DatadogECSManagedInstancesInternalProps } from "./internal.interfaces";

export function mergeManagedInstancesProps(
  lowerPrecedence: DatadogECSManagedInstancesProps,
  higherPrecedence: DatadogECSManagedInstancesProps | undefined,
): DatadogECSManagedInstancesProps {
  if (higherPrecedence === undefined) {
    return lowerPrecedence;
  }

  const newProps = {
    ...lowerPrecedence,
    ...higherPrecedence,
  };

  newProps.apm = {
    ...lowerPrecedence.apm,
    ...higherPrecedence.apm,
  };
  newProps.dogstatsd = {
    ...lowerPrecedence.dogstatsd,
    ...higherPrecedence.dogstatsd,
  };
  newProps.orchestratorExplorer = {
    ...lowerPrecedence.orchestratorExplorer,
    ...higherPrecedence.orchestratorExplorer,
  };
  newProps.logCollection = {
    ...lowerPrecedence.logCollection,
    ...higherPrecedence.logCollection,
  };
  newProps.networkMonitoring = {
    ...lowerPrecedence.networkMonitoring,
    ...higherPrecedence.networkMonitoring,
  };
  newProps.processCollection = {
    ...lowerPrecedence.processCollection,
    ...higherPrecedence.processCollection,
  };
  newProps.deploymentConfiguration = {
    ...lowerPrecedence.deploymentConfiguration,
    ...higherPrecedence.deploymentConfiguration,
    alarms: {
      ...lowerPrecedence.deploymentConfiguration?.alarms,
      ...higherPrecedence.deploymentConfiguration?.alarms,
    },
  };

  return newProps;
}

export function validateECSManagedInstancesProps(props: DatadogECSManagedInstancesInternalProps): void {
  if (process.env.DD_CDK_BYPASS_VALIDATION) {
    log.debug("Bypassing props validation...");
    return;
  }

  if (props.family === undefined || props.family === "") {
    throw new Error("The `family` property must be defined.");
  }

  // Container log collection through the agent is not supported in daemon
  // mode on ECS Managed Instances.
  if (props.logCollection?.isEnabled) {
    throw new Error(
      "Container log collection through the Datadog Agent is not supported in daemon mode on ECS Managed " +
        "Instances. Use the FireLens log driver or the 'awslogs' driver configured directly on your " +
        "application task definition instead.",
    );
  }

  // The Agent needs writable directories (configuration, temp, run), and a
  // daemon task has no sibling containers to depend on the Agent.
  if (props.readOnlyRootFilesystem) {
    throw new Error("The `readOnlyRootFilesystem` property is not supported in daemon mode on ECS Managed Instances.");
  }
  if (props.isDatadogDependencyEnabled) {
    throw new Error(
      "The `isDatadogDependencyEnabled` property is not supported in daemon mode on ECS Managed Instances, " +
        "since the daemon task contains only the Datadog Agent container.",
    );
  }

  const seenVolumeNames = new Set<string>();
  const seenContainerPaths = new Set<string>(ManagedContainerPaths);
  for (const volume of props.volumes ?? []) {
    if (!/^[a-zA-Z0-9_-]{1,255}$/.test(volume.name)) {
      throw new Error(
        `Invalid volume name "${volume.name}". Use letters, numbers, underscores and hyphens, up to 255 characters.`,
      );
    }
    if (ManagedVolumeNames.includes(volume.name)) {
      throw new Error(
        `The volume name "${volume.name}" is used by a volume this construct manages. ` +
          `Choose a name other than: ${ManagedVolumeNames.join(", ")}.`,
      );
    }
    if (seenVolumeNames.has(volume.name)) {
      throw new Error(`The volume name "${volume.name}" is used more than once.`);
    }
    seenVolumeNames.add(volume.name);

    if (!volume.hostPath.startsWith("/")) {
      throw new Error(`The \`hostPath\` of volume "${volume.name}" must be an absolute path.`);
    }
    const containerPath = volume.containerPath ?? volume.hostPath;
    if (!containerPath.startsWith("/")) {
      throw new Error(`The \`containerPath\` of volume "${volume.name}" must be an absolute path.`);
    }
    if (seenContainerPaths.has(containerPath)) {
      throw new Error(
        `The container path "${containerPath}" of volume "${volume.name}" is already mounted in the Datadog Agent container.`,
      );
    }
    seenContainerPaths.add(containerPath);
  }

  if (props.createDaemon) {
    if (props.clusterArn === undefined) {
      throw new Error("The `clusterArn` property must be provided when `createDaemon` is true.");
    }
    if (props.capacityProviderArns === undefined || props.capacityProviderArns.length === 0) {
      throw new Error(
        "The `capacityProviderArns` property must contain at least one ARN when `createDaemon` is true. " +
          "ECS Managed Daemons only run on ECS Managed Instances capacity providers.",
      );
    }
  }
}
