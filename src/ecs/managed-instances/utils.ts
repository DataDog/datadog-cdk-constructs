/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import log from "loglevel";
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
