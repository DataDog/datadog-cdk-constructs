/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as crypto from "crypto";
export const DD_ACCOUNT_ID = "464622532012";
export const DD_GOV_ACCOUNT_ID = "002406178527";

export enum RuntimeType {
  NODE,
  PYTHON,
  UNSUPPORTED,
}
const layerPrefix = "DatadogLayer";
const extensionLayerPrefix = "DatadogExtension";
export const runtimeLookup: { [key: string]: RuntimeType } = {
  "nodejs10.x": RuntimeType.NODE,
  "nodejs12.x": RuntimeType.NODE,
  "nodejs8.10": RuntimeType.NODE,
  "python2.7": RuntimeType.PYTHON,
  "python3.6": RuntimeType.PYTHON,
  "python3.7": RuntimeType.PYTHON,
  "python3.8": RuntimeType.PYTHON,
};

const runtimeToLayerName: { [key: string]: string } = {
  "nodejs8.10": "Datadog-Node8-10",
  "nodejs10.x": "Datadog-Node10-x",
  "nodejs12.x": "Datadog-Node12-x",
  "python2.7": "Datadog-Python27",
  "python3.6": "Datadog-Python36",
  "python3.7": "Datadog-Python37",
  "python3.8": "Datadog-Python38",
};

const layers: Map<string, lambda.ILayerVersion> = new Map();

export function applyLayers(
  scope: cdk.Construct,
  region: string,
  lambdas: lambda.Function[],
  pythonLayerVersion?: number,
  nodeLayerVersion?: number,
  extensionLayerVersion?: number,
) {
  // TODO: check region availability
  const errors: string[] = [];
  lambdas.forEach((lam) => {
    const runtime: string = lam.runtime.name;
    const lambdaRuntimeType: RuntimeType = runtimeLookup[runtime];
    if (lambdaRuntimeType === RuntimeType.UNSUPPORTED) {
      return;
    }

    let lambdaLayerArn;
    let extensionLayerArn;

    if (lambdaRuntimeType === RuntimeType.PYTHON) {
      if (pythonLayerVersion === undefined) {
        errors.push(getMissingLayerVersionErrorMsg(lam.node.id, "Python", "python"));
        return;
      }
      lambdaLayerArn = getLambdaLayerArn(region, pythonLayerVersion, runtime);
    }

    if (lambdaRuntimeType === RuntimeType.NODE) {
      if (nodeLayerVersion === undefined) {
        errors.push(getMissingLayerVersionErrorMsg(lam.node.id, "Node.js", "node"));
        return;
      }
      lambdaLayerArn = getLambdaLayerArn(region, nodeLayerVersion, runtime);
    }

    if (extensionLayerVersion !== undefined) {
      extensionLayerArn = getExtensionLayerArn(region, extensionLayerVersion);
    }

    if (lambdaLayerArn !== undefined) {
      let lambdaLayer = layers.get(lambdaLayerArn);
      if (lambdaLayer === undefined) {
        const layerId = generateLambdaLayerId(lam.functionArn, runtime);
        lambdaLayer = lambda.LayerVersion.fromLayerVersionArn(scope, layerId, lambdaLayerArn);
        layers.set(lambdaLayerArn, lambdaLayer); // could have token in key string
      }
      // TODO: check if lambdaLayer extracted generated error or is undefined
      lam.addLayers(lambdaLayer);
    }

    if (extensionLayerArn !== undefined) {
      let extensionLayer = layers.get(extensionLayerArn);
      if (extensionLayer === undefined) {
        const layerId = generateExtensionLayerId(lam.functionArn, runtime);
        extensionLayer = lambda.LayerVersion.fromLayerVersionArn(scope, layerId, extensionLayerArn);
        layers.set(extensionLayerArn, extensionLayer);
      }
      lam.addLayers(extensionLayer);
    }
  });
  return errors;
}

export function getLambdaLayerArn(region: string, version: number, runtime: string) {
  const layerName = runtimeToLayerName[runtime];
  // TODO: edge case where gov cloud is the region, but they are using a token so we can't resolve it.
  const isGovCloud = region === "us-gov-east-1" || region === "us-gov-west-1";

  // if this is a GovCloud region, use the GovCloud lambda layer
  if (isGovCloud) {
    return `arn:aws-us-gov:lambda:${region}:${DD_GOV_ACCOUNT_ID}:layer:${layerName}:${version}`;
  }
  return `arn:aws:lambda:${region}:${DD_ACCOUNT_ID}:layer:${layerName}:${version}`;
}

export function getExtensionLayerArn(region: string, version: number) {
  const isGovCloud = region === "us-gov-east-1" || region === "us-gov-west-1";
  if (isGovCloud) {
    return `arn:aws-us-gov:lambda:${region}:${DD_GOV_ACCOUNT_ID}:layer:Datadog-Extension:${version}`;
  }
  return `arn:aws:lambda:${region}:${DD_ACCOUNT_ID}:layer:Datadog-Extension:${version}`;
}

export function getMissingLayerVersionErrorMsg(functionKey: string, formalRuntime: string, paramRuntime: string) {
  return (
    `Resource ${functionKey} has a ${formalRuntime} runtime, but no ${formalRuntime} Lambda Library version was provided. ` +
    `Please add the '${paramRuntime}LayerVersion' parameter for the Datadog serverless macro.`
  );
}

function generateLambdaLayerId(lambdaFunctionArn: string, runtime: string) {
  const layerValue: string = crypto.createHash("sha256").update(lambdaFunctionArn).digest("hex");
  return layerPrefix + "-" + runtime + "-" + layerValue;
}

function generateExtensionLayerId(lambdaFunctionArn: string, runtime: string) {
  const layerValue: string = crypto.createHash("sha256").update(lambdaFunctionArn).digest("hex");
  return extensionLayerPrefix + "-" + runtime + "-" + layerValue;
}
