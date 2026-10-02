/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import { Token } from "aws-cdk-lib";
import log from "loglevel";
import {
  DatadogManagedContainerNames,
  ParseJsonFirelensConfigFileType,
  ParseJsonFirelensConfigFileValue,
  TracerImageTagRegExp,
} from "./constants";
import { DatadogECSFargateProps, LoggingType, TracerLanguage, TracerLibc } from "./interfaces";
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

  if (props.apmInstrumentation !== undefined) {
    validateAPMInstrumentationProps(props);
  }
}

function validateAPMInstrumentationProps(props: DatadogECSFargateInternalProps): void {
  const { language, tracerVersion, tracerLibc, containerName } = props.apmInstrumentation!;
  const languages = Object.values(TracerLanguage);
  if (!languages.includes(language)) {
    throw new Error(`The \`apmInstrumentation.language\` property must be one of: ${languages.join(", ")}.`);
  }
  if (props.isLinux === false) {
    throw new Error("Automatic APM instrumentation is only supported on Linux.");
  }
  if (!props.apm!.isEnabled) {
    throw new Error("Automatic APM instrumentation requires `apm.isEnabled` to be true.");
  }

  // A version only known at deployment is left to the image pull
  const isVersionKnown = tracerVersion !== undefined && !Token.isUnresolved(tracerVersion);
  if (isVersionKnown && !TracerImageTagRegExp.test(tracerVersion)) {
    throw new Error(
      `The \`apmInstrumentation.tracerVersion\` property ${JSON.stringify(tracerVersion)} is not a valid image tag.`,
    );
  }

  if (language === TracerLanguage.RUBY && tracerLibc === TracerLibc.MUSL) {
    throw new Error(
      "Automatic APM instrumentation for Ruby does not support musl. Use `TracerLibc.GLIBC`, or install the tracer in the application image.",
    );
  }
  if (language === TracerLanguage.DOTNET) {
    if (props.isArm64) {
      throw new Error(
        "Automatic APM instrumentation for .NET is not supported on ARM64. Use an X86_64 task, or install the tracer in the application image.",
      );
    }
    const pinnedMajor = isVersionKnown ? tracerVersion.match(/^v?(\d+)(?:\.|$)/)?.[1] : undefined;
    if (pinnedMajor !== undefined && Number(pinnedMajor) < 3) {
      throw new Error(
        `Automatic APM instrumentation for .NET requires tracer version 3.0 or later, but \`tracerVersion\` is ${JSON.stringify(
          tracerVersion,
        )}.`,
      );
    }
  }

  const requestedName = containerName?.trim();
  if (requestedName && DatadogManagedContainerNames.has(requestedName)) {
    throw new Error(
      `Cannot add the tracer to the ${requestedName} container, which the construct manages. Set \`apmInstrumentation.containerName\` to an application container.`,
    );
  }
}
