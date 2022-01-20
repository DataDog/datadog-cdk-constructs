/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

/*
 * This file used to be in v1/src, was moved to common by using the ILambdaFunction interface
 * in place of importing Function from @aws-cdk/aws-lambda
 * 
 * NOTE: The only change to the functions are the use of ILambdaFunction 
 */

import log from "loglevel";
import {
  RuntimeType,
  runtimeLookup,
  DD_HANDLER_ENV_VAR,
  JS_HANDLER_WITH_LAYERS,
  JS_HANDLER,
  PYTHON_HANDLER,
} from "./constants";
import { ILambdaFunction } from "./interfaces";

/**
 * To avoid modifying code in the user's lambda handler, redirect the handler to a Datadog
 * handler that initializes the Lambda Layers and then calls the original handler.
 * 'DD_LAMBDA_HANDLER' is set to the original handler in the lambda's environment for the
 * replacement handler to find.
 * 
 * Unchanged aside from parameter type
 */
export function redirectHandlers(lambdas: ILambdaFunction[], addLayers: boolean) {
  log.debug(`Wrapping Lambda function handlers with Datadog handler...`);
  lambdas.forEach((lam) => {
    // const cfnFunction = lam.node.defaultChild as lambda.CfnFunction;
    const cfnFunction = lam.node.defaultChild;
    const originalHandler = cfnFunction.handler as string;
    lam.addEnvironment(DD_HANDLER_ENV_VAR, originalHandler);
    const handler = getDDHandler(lam, addLayers);
    if (handler === undefined) {
      log.debug("Unable to get Datadog handler");
      return;
    }
    cfnFunction.handler = handler;
  });
}
/*
 * Unchanged aside from parameter type
 */
function getDDHandler(lam: ILambdaFunction, addLayers: boolean) {
  const runtime: string = lam.runtime.name;
  const lambdaRuntime: RuntimeType = runtimeLookup[runtime];
  if (lambdaRuntime === undefined || lambdaRuntime === RuntimeType.UNSUPPORTED) {
    log.debug("Unsupported/undefined Lambda runtime");
    return;
  }
  switch (lambdaRuntime) {
    case RuntimeType.NODE:
      return addLayers ? JS_HANDLER_WITH_LAYERS : JS_HANDLER;
    case RuntimeType.PYTHON:
      return PYTHON_HANDLER;
  }
}
