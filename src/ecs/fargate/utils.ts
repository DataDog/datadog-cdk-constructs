/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import log from "loglevel";
import { DatadogECSFargateInternalProps, DatadogECSFargateProps, LoggingType } from "./interfaces";

export function mergeFargateProps(
  lowerPrecedence: DatadogECSFargateProps,
  higherPrecedence: DatadogECSFargateProps,
): DatadogECSFargateProps {
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
  newProps.logCollection = {
    ...lowerPrecedence.logCollection,
    ...higherPrecedence.logCollection,
    logDriverConfiguration: {
      ...lowerPrecedence.logCollection?.logDriverConfiguration,
      ...higherPrecedence.logCollection?.logDriverConfiguration,
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
    if (props.logCollection.logDriverConfiguration === undefined) {
      throw new Error("The `logDriverConfiguration` property must be defined when logging enabled.");
    }
    if (props.logCollection.loggingType === LoggingType.FLUENTBIT && props.isLinux === false) {
      throw new Error("Fluent Bit logging is only supported on Linux.");
    }
  }
}
