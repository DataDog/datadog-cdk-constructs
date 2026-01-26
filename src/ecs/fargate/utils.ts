/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import log from "loglevel";
import { ParseJsonFirelensConfigFileType, ParseJsonFirelensConfigFileValue } from "./constants";
import { DatadogECSFargateProps, LoggingType } from "./interfaces";
import { DatadogECSFargateInternalProps } from "./internal.interfaces";

export function mergeFargateProps(
  lowerPrecedence: DatadogECSFargateProps,
  higherPrecedence: DatadogECSFargateProps | undefined,
): DatadogECSFargateProps {
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
  const firelensOptions = {
    ...lowerPrecedence.logCollection?.fluentbitConfig?.firelensOptions,
    ...higherPrecedence.logCollection?.fluentbitConfig?.firelensOptions,
  };
  if (firelensOptions.isParseJson === true) {
    firelensOptions.configFileType = ParseJsonFirelensConfigFileType;
    firelensOptions.configFileValue = ParseJsonFirelensConfigFileValue;
  }
  newProps.logCollection = {
    ...lowerPrecedence.logCollection,
    ...higherPrecedence.logCollection,
    fluentbitConfig: {
      ...lowerPrecedence.logCollection?.fluentbitConfig,
      ...higherPrecedence.logCollection?.fluentbitConfig,
      logDriverConfig: {
        ...lowerPrecedence.logCollection?.fluentbitConfig?.logDriverConfig,
        ...higherPrecedence.logCollection?.fluentbitConfig?.logDriverConfig,
      },
      firelensOptions: firelensOptions,
    },
  };
  newProps.cws = {
    ...lowerPrecedence.cws,
    ...higherPrecedence.cws,
  };

  return newProps;
}

export function validateECSFargateProps(props: DatadogECSFargateInternalProps): void {
  if (process.env.DD_CDK_BYPASS_VALIDATION) {
    log.debug("Bypassing props validation...");
    return;
  }

  if (props.logCollection === undefined) {
    throw new Error("The `logCollection` property must be defined.");
  }

  if (props.logCollection.isEnabled) {
    if (props.logCollection.loggingType === undefined) {
      throw new Error("The `loggingType` property must be defined when logging enabled.");
    }
    if (props.logCollection.loggingType === LoggingType.FLUENTBIT) {
      if (props.isLinux === false) {
        throw new Error("Fluent Bit logging is only supported on Linux.");
      }
      if (props.logCollection.fluentbitConfig === undefined) {
        throw new Error("The `fluentbitConfig` property must be defined when fluentbit logging enabled.");
      }
      if (props.logCollection.fluentbitConfig.logDriverConfig === undefined) {
        throw new Error("The `logDriverConfig` property must be defined when logging enabled.");
      }
      if (props.logCollection.fluentbitConfig.firelensOptions === undefined) {
        throw new Error("The `firelensOptions` property must be defined when logging enabled.");
      }
    }
  }

  if (props.cws === undefined) {
    throw new Error("The `cws` property must be defined.");
  }

  if (props.cws?.isEnabled) {
    if (props.isLinux === false) {
      throw new Error("CWS is only supported on Linux.");
    }
    if (props.isDatadogDependencyEnabled === false) {
      throw new Error(
        "CWS configuration highly recommends Datadog Agent dependency enabled. The CWS tracer eventually exits the application if it can't connect to the Datadog Agent.",
      );
    }
  }

  if (props.orchestratorExplorer === undefined) {
    throw new Error("The `orchestratorExplorer` property must be defined.");
  }
}
