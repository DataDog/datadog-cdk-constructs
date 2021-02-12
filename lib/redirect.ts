/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { RuntimeType, runtimeLookup } from "./index";
import * as lambda from "@aws-cdk/aws-lambda";
export const DD_HANDLER_ENV_VAR = "DD_LAMBDA_HANDLER";
export const PYTHON_HANDLER = "datadog_lambda.handler.handler";
export const JS_HANDLER_WITH_LAYERS = "/opt/nodejs/node_modules/datadog-lambda-js/handler.handler";
export const JS_HANDLER = "node_modules/datadog-lambda-js/dist/handler.handler";

/**
 * To avoid modifying code in the user's lambda handler, redirect the handler to a Datadog
 * handler that initializes the Lambda Layers and then calls the original handler.
 * 'DD_LAMBDA_HANDLER' is set to the original handler in the lambda's environment for the
 * replacement handler to find.
 */

export function redirectHandlers(lambdas: lambda.Function[], addLayers: boolean) {
  lambdas.forEach((lam) => {
    const cfnFunction = lam.node.defaultChild as lambda.CfnFunction;
    const originalHandler = cfnFunction.handler as string;
    lam.addEnvironment(DD_HANDLER_ENV_VAR, originalHandler);
    const handler = getDDHandler(lam, addLayers);
    if (handler === undefined) {
      return;
    }
    cfnFunction.handler = handler;
  });
}

function getDDHandler(lam: lambda.Function, addLayers: boolean) {
  const runtime: string = lam.runtime.name;
  const lambdaRuntime: RuntimeType = runtimeLookup[runtime];
  if (lambdaRuntime === undefined || lambdaRuntime === RuntimeType.UNSUPPORTED) {
    return;
  }
  switch (lambdaRuntime) {
    case RuntimeType.NODE:
      return addLayers ? JS_HANDLER_WITH_LAYERS : JS_HANDLER;
    case RuntimeType.PYTHON:
      return PYTHON_HANDLER;
  }
}
