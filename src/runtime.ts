/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import * as lambda from "aws-cdk-lib/aws-lambda";
import { RuntimeType, runtimeLookup } from "./constants";

export function getRuntimeType(runtime: lambda.Runtime): RuntimeType | undefined {
  const runtimeType = runtimeLookup[runtime.name];
  if (runtimeType !== undefined || process.env.DD_CDK_BYPASS_RUNTIME_VALIDATION !== "true") {
    return runtimeType;
  }

  switch (runtime.family) {
    case lambda.RuntimeFamily.NODEJS:
      return RuntimeType.NODE;
    case lambda.RuntimeFamily.PYTHON:
      return RuntimeType.PYTHON;
    case lambda.RuntimeFamily.JAVA:
      return RuntimeType.JAVA;
    case lambda.RuntimeFamily.DOTNET_CORE:
      return RuntimeType.DOTNET;
    case lambda.RuntimeFamily.RUBY:
      return RuntimeType.RUBY;
    case lambda.RuntimeFamily.OTHER:
      return RuntimeType.CUSTOM;
    case lambda.RuntimeFamily.GO:
    case undefined:
      return undefined;
  }
}
