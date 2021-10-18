/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as crypto from "crypto";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import log from "loglevel";
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
  "nodejs14.x": RuntimeType.NODE,
  "python2.7": RuntimeType.PYTHON,
  "python3.6": RuntimeType.PYTHON,
  "python3.7": RuntimeType.PYTHON,
  "python3.8": RuntimeType.PYTHON,
  "python3.9": RuntimeType.PYTHON,
};

const runtimeToLayerName: { [key: string]: string } = {
  "nodejs10.x": "Datadog-Node10-x",
  "nodejs12.x": "Datadog-Node12-x",
  "nodejs14.x": "Datadog-Node14-x",
  "python2.7": "Datadog-Python27",
  "python3.6": "Datadog-Python36",
  "python3.7": "Datadog-Python37",
  "python3.8": "Datadog-Python38",
  "python3.9": "Datadog-Python39",
};

const layers: Map<string, lambda.ILayerVersion> = new Map();

export function applyLayers(
  scope: cdk.Construct,
  region: string,
  lambdas: lambda.Function[],
  pythonLayerVersion?: number,
  nodeLayerVersion?: number,
  extensionLayerVersion?: number,
  architecture?: string,
) {
  // TODO: check region availability
  const errors: string[] = [];
  log.debug("Applying layers to Lambda functions...");
  lambdas.forEach((lam) => {
    const runtime: string = lam.runtime.name;
    const lambdaRuntimeType: RuntimeType = runtimeLookup[runtime];
    const isARM = architecture === "ARM_64";
    if (lambdaRuntimeType === RuntimeType.UNSUPPORTED) {
      log.debug(`Unsupported runtime: ${runtime}`);
      return;
    }

    let lambdaLayerArn;
    let extensionLayerArn;
    if (lambdaRuntimeType === RuntimeType.PYTHON) {
      if (pythonLayerVersion === undefined) {
        errors.push(getMissingLayerVersionErrorMsg(lam.node.id, "Python", "python"));
        return;
      }
      lambdaLayerArn = getLambdaLayerArn(region, pythonLayerVersion, runtime, isARM);
      log.debug(`Using Python Lambda layer: ${lambdaLayerArn}`);
      addLayer(lambdaLayerArn, false, scope, lam, runtime);
    }

    if (lambdaRuntimeType === RuntimeType.NODE) {
      if (nodeLayerVersion === undefined) {
        errors.push(getMissingLayerVersionErrorMsg(lam.node.id, "Node.js", "node"));
        return;
      }
      lambdaLayerArn = getLambdaLayerArn(region, nodeLayerVersion, runtime, isARM);
      log.debug(`Using Node Lambda layer: ${lambdaLayerArn}`);
      addLayer(lambdaLayerArn, false, scope, lam, runtime);
    }

    if (extensionLayerVersion !== undefined) {
      extensionLayerArn = getExtensionLayerArn(region, extensionLayerVersion, isARM);
      log.debug(`Using extension layer: ${extensionLayerArn}`);
      addLayer(extensionLayerArn, true, scope, lam, runtime);
    }
  });
  return errors;
}

function addLayer(
  layerArn: string,
  isExtensionLayer: boolean,
  scope: cdk.Construct,
  lam: lambda.Function,
  runtime: string,
) {
  let layerId;
  if (isExtensionLayer) {
    layerId = generateExtensionLayerId(lam.functionArn);
  } else {
    layerId = generateLambdaLayerId(lam.functionArn, runtime);
  }

  if (layerArn !== undefined) {
    let lambdaLayer = layers.get(layerArn);
    if (lambdaLayer === undefined) {
      lambdaLayer = lambda.LayerVersion.fromLayerVersionArn(scope, layerId, layerArn);
      layers.set(layerArn, lambdaLayer);
    }
    log.debug(`Adding layer ${lambdaLayer} to Lambda: ${lam.functionName}`);
    lam.addLayers(lambdaLayer);
  }
}

export function getLambdaLayerArn(region: string, version: number, runtime: string, isArm: boolean) {
  const baseLayerName = runtimeToLayerName[runtime];
  const layerName = isArm ? `${baseLayerName}-ARM` : baseLayerName;
  // TODO: edge case where gov cloud is the region, but they are using a token so we can't resolve it.
  const isGovCloud = region === "us-gov-east-1" || region === "us-gov-west-1";

  // if this is a GovCloud region, use the GovCloud lambda layer
  if (isGovCloud) {
    log.debug("GovCloud region detected, using the GovCloud lambda layer");
    return `arn:aws-us-gov:lambda:${region}:${DD_GOV_ACCOUNT_ID}:layer:${layerName}:${version}`;
  }
  return `arn:aws:lambda:${region}:${DD_ACCOUNT_ID}:layer:${layerName}:${version}`;
}

export function getExtensionLayerArn(region: string, version: number, isArm: boolean) {
  const baseLayerName = "Datadog-Extension";
  const layerName = isArm ? `${baseLayerName}-ARM` : baseLayerName;
  const isGovCloud = region === "us-gov-east-1" || region === "us-gov-west-1";
  if (isGovCloud) {
    log.debug("GovCloud region detected, using the GovCloud extension layer");
    return `arn:aws-us-gov:lambda:${region}:${DD_GOV_ACCOUNT_ID}:layer:${layerName}:${version}`;
  }
  return `arn:aws:lambda:${region}:${DD_ACCOUNT_ID}:layer:${layerName}:${version}`;
}

export function getMissingLayerVersionErrorMsg(functionKey: string, formalRuntime: string, paramRuntime: string) {
  return (
    `Resource ${functionKey} has a ${formalRuntime} runtime, but no ${formalRuntime} Lambda Library version was provided. ` +
    `Please add the '${paramRuntime}LayerVersion' parameter for the Datadog serverless macro.`
  );
}

export function generateLambdaLayerId(lambdaFunctionArn: string, runtime: string) {
  log.debug("Generating construct Id for Datadog Lambda layer");
  const layerValue: string = crypto.createHash("sha256").update(lambdaFunctionArn).digest("hex");
  return layerPrefix + "-" + runtime + "-" + layerValue;
}

export function generateExtensionLayerId(lambdaFunctionArn: string) {
  log.debug("Generating construct Id for Datadog Extension layer");
  const layerValue: string = crypto.createHash("sha256").update(lambdaFunctionArn).digest("hex");
  return extensionLayerPrefix + "-" + layerValue;
}
