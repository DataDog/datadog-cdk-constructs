/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
import { Architecture } from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import log from "loglevel";
import * as constants from "./common/constants";
import * as exp from "./common/experiment";

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
  log.debug("Applying layers to Lambda functions...");
  lambdas.forEach((lam) => {
    const runtime: string = lam.runtime.name;
    const lambdaRuntimeType: constants.RuntimeType = constants.runtimeLookup[runtime];
    const isARM = lam.architecture === Architecture.ARM_64;
    const isNode = lambdaRuntimeType === constants.RuntimeType.NODE;
    if (lambdaRuntimeType === constants.RuntimeType.UNSUPPORTED) {
      log.debug(`Unsupported runtime: ${runtime}`);
      return;
    }

    let lambdaLayerArn;
    let extensionLayerArn;
    if (lambdaRuntimeType === constants.RuntimeType.PYTHON) {
      if (pythonLayerVersion === undefined) {
        errors.push(exp.getMissingLayerVersionErrorMsg(lam.node.id, "Python", "python"));
        return;
      }
      lambdaLayerArn = exp.getLambdaLayerArn(region, pythonLayerVersion, runtime, isARM, isNode);
      log.debug(`Using Python Lambda layer: ${lambdaLayerArn}`);
      addLayer(lambdaLayerArn, false, scope, lam, runtime);
    }

    if (lambdaRuntimeType === constants.RuntimeType.NODE) {
      if (nodeLayerVersion === undefined) {
        errors.push(exp.getMissingLayerVersionErrorMsg(lam.node.id, "Node.js", "node"));
        return;
      }
      lambdaLayerArn = exp.getLambdaLayerArn(region, nodeLayerVersion, runtime, isARM, isNode);
      log.debug(`Using Node Lambda layer: ${lambdaLayerArn}`);
      addLayer(lambdaLayerArn, false, scope, lam, runtime);
    }

    if (extensionLayerVersion !== undefined) {
      extensionLayerArn = exp.getExtensionLayerArn(region, extensionLayerVersion, isARM);
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
    layerId = exp.generateExtensionLayerId(lam.functionArn);
  } else {
    layerId = exp.generateLambdaLayerId(lam.functionArn, runtime);
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
