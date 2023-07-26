/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import log from "loglevel";
import {
  RuntimeType,
  runtimeLookup,
  DD_HANDLER_ENV_VAR,
  AWS_JAVA_WRAPPER_ENV_VAR,
  AWS_JAVA_WRAPPER_ENV_VAR_VALUE,
  JS_HANDLER_WITH_LAYERS,
  JS_HANDLER,
  PYTHON_HANDLER,
  LambdaFunction,
} from "./index";

/**
 * To avoid modifying code in the user's lambda handler, redirect the handler to a Datadog
 * handler that initializes the Lambda Layers and then calls the original handler.
 * 'DD_LAMBDA_HANDLER' is set to the original handler in the lambda's environment for the
 * replacement handler to find.
 *
 * Unchanged aside from parameter type
 */
export function redirectHandlers(lambdas: LambdaFunction[], addLayers: boolean) {
  log.debug(`Wrapping Lambda function handlers with Datadog handler...`);
  lambdas.forEach((lam) => {
    const runtime: string = lam.runtime.name;
    const lambdaRuntime: RuntimeType = runtimeLookup[runtime];
    if (lambdaRuntime === RuntimeType.JAVA) {
      lam.addEnvironment(AWS_JAVA_WRAPPER_ENV_VAR, AWS_JAVA_WRAPPER_ENV_VAR_VALUE);
    } else {
      const cfnFunction = lam.node.defaultChild;
      if (cfnFunction === undefined) {
        log.debug("Unable to get Lambda Function handler");
        return;
      }
      const originalHandler = cfnFunction.handler as string;
      lam.addEnvironment(DD_HANDLER_ENV_VAR, originalHandler);
      const handler = getDDHandler(lambdaRuntime, addLayers);
      if (handler === undefined) {
        log.debug("Unable to get Datadog handler");
        return;
      }
      cfnFunction.handler = handler;
    }
  });
}

function getDDHandler(lambdaRuntime: RuntimeType, addLayers: boolean) {
  if (lambdaRuntime === undefined || lambdaRuntime === RuntimeType.UNSUPPORTED) {
    log.debug("Unsupported/undefined Lambda runtime");
    return;
  }
  switch (lambdaRuntime) {
    case RuntimeType.NODE:
      return addLayers ? JS_HANDLER_WITH_LAYERS : JS_HANDLER;
    case RuntimeType.PYTHON:
      return PYTHON_HANDLER;
    case RuntimeType.JAVA:
      return null;
  }
}
