/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { DatadogECSFargateProps } from "./interfaces";

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
