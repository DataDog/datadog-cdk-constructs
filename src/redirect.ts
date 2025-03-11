/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "aws-cdk-lib/aws-lambda";
import log from "loglevel";
import {
  RuntimeType,
  runtimeLookup,
  DD_HANDLER_ENV_VAR,
  AWS_LAMBDA_EXEC_WRAPPER_ENV_VAR,
  AWS_LAMBDA_EXEC_WRAPPER,
  JS_HANDLER_WITH_LAYERS,
  JS_HANDLER,
  PYTHON_HANDLER,
} from "./constants";

/**
 * To avoid modifying code in the user's lambda handler, redirect the handler to a Datadog
 * handler that initializes the Lambda Layers and then calls the original handler.
 * 'DD_LAMBDA_HANDLER' is set to the original handler in the lambda's environment for the
 * replacement handler to find.
 *
 * Unchanged aside from parameter type
 */
export function redirectHandlers(lam: lambda.Function, addLayers: boolean): void {
  log.debug(`Wrapping Lambda function handlers with Datadog handler...`);

  const runtime: string = lam.runtime.name;
  const runtimeType: RuntimeType = runtimeLookup[runtime];

  if (runtimeType === RuntimeType.JAVA || runtimeType === RuntimeType.DOTNET) {
    lam.addEnvironment(AWS_LAMBDA_EXEC_WRAPPER_ENV_VAR, AWS_LAMBDA_EXEC_WRAPPER);
    return;
  }

  const cfnFuntion = lam.node.defaultChild as lambda.CfnFunction;
  if (cfnFuntion === undefined) {
    log.debug("Unable to get Lambda Function handler");
    return;
  }

  const originalHandler = cfnFuntion.handler as string;
  lam.addEnvironment(DD_HANDLER_ENV_VAR, originalHandler);

  const handler = getDDHandler(runtimeType, addLayers);
  if (handler === null) {
    log.debug("Unable to get Datadog handler");
    return;
  }

  cfnFuntion.handler = handler;
}

function getDDHandler(runtimeType: RuntimeType, addLayers: boolean): string | null {
  if (runtimeType === undefined || runtimeType === RuntimeType.UNSUPPORTED) {
    log.debug("Unsupported/undefined Lambda runtime");
    return null;
  }
  switch (runtimeType) {
    case RuntimeType.NODE:
      return addLayers ? JS_HANDLER_WITH_LAYERS : JS_HANDLER;
    case RuntimeType.PYTHON:
      return PYTHON_HANDLER;
    case RuntimeType.CUSTOM:
    case RuntimeType.JAVA:
    case RuntimeType.DOTNET:
    case RuntimeType.RUBY:
    default:
      return null;
  }
}
