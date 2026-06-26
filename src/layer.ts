/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as crypto from "crypto";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { Architecture } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import log from "loglevel";
import {
  runtimeLookup,
  RuntimeType,
  runtimeToLayerName,
  govCloudRegions,
  DD_GOV_ACCOUNT_ID,
  DD_ACCOUNT_ID,
  LAYER_PREFIX,
  EXTENSION_LAYER_PREFIX,
  DatadogDefaultLayerVersions,
} from "./index";

const layers: Map<string, lambda.ILayerVersion> = new Map();

export function applyLayers(
  scope: Construct,
  region: string,
  lam: lambda.Function,
  pythonLayerVersion?: number,
  pythonLayerArn?: string,
  nodeLayerVersion?: number,
  nodeLayerArn?: string,
  javaLayerVersion?: number,
  javaLayerArn?: string,
  dotnetLayerVersion?: number,
  dotnetLayerArn?: string,
  rubyLayerVersion?: number,
  rubyLayerArn?: string,
  useLayersFromAccount?: string,
): string[] {
  // TODO: check region availability
  const errors: string[] = [];
  log.debug("Applying layers to Lambda functions...");
  const runtime: string = lam.runtime.name;
  const lambdaRuntimeType: RuntimeType = runtimeLookup[runtime];
  const isARM = lam.architecture?.dockerPlatform === Architecture.ARM_64.dockerPlatform;

  if (lambdaRuntimeType === undefined || lambdaRuntimeType === RuntimeType.UNSUPPORTED) {
    const error = `Unsupported runtime: ${runtime}`;
    log.warn(error);
    errors.push(error);
    return errors;
  }

  const accountId = useLayersFromAccount;
  let lambdaLayerArn;
  switch (lambdaRuntimeType) {
    case RuntimeType.PYTHON:
      lambdaLayerArn = tryToFigureOutTracingLayerArn(
        region,
        accountId,
        runtime,
        isARM,
        errors,
        "Python",
        "python",
        pythonLayerVersion,
        pythonLayerArn,
        DatadogDefaultLayerVersions.PYTHON,
      );
      if (lambdaLayerArn === undefined) {
        return errors;
      }
      log.debug(`Using Python Lambda layer: ${lambdaLayerArn}`);
      addLayer(lambdaLayerArn, false, scope, lam, runtime);
      break;

    case RuntimeType.NODE:
      lambdaLayerArn = tryToFigureOutTracingLayerArn(
        region,
        accountId,
        runtime,
        false, // Node has no ARM layer
        errors,
        "Node.js",
        "node",
        nodeLayerVersion,
        nodeLayerArn,
        DatadogDefaultLayerVersions.NODE,
      );
      if (lambdaLayerArn === undefined) {
        return errors;
      }

      log.debug(`Using Node Lambda layer: ${lambdaLayerArn}`);
      addLayer(lambdaLayerArn, false, scope, lam, runtime);
      break;

    case RuntimeType.JAVA:
      lambdaLayerArn = tryToFigureOutTracingLayerArn(
        region,
        accountId,
        runtime,
        false, // Java has no ARM layer
        errors,
        "Java",
        "java",
        javaLayerVersion,
        javaLayerArn,
        DatadogDefaultLayerVersions.JAVA,
      );
      if (lambdaLayerArn === undefined) {
        return errors;
      }

      log.debug(`Using dd-trace-java layer: ${lambdaLayerArn}`);
      addLayer(lambdaLayerArn, false, scope, lam, runtime);
      break;

    case RuntimeType.DOTNET:
      lambdaLayerArn = tryToFigureOutTracingLayerArn(
        region,
        accountId,
        runtime,
        isARM,
        errors,
        ".NET",
        "dotnet",
        dotnetLayerVersion,
        dotnetLayerArn,
        DatadogDefaultLayerVersions.DOTNET,
      );
      if (lambdaLayerArn === undefined) {
        return errors;
      }

      log.debug(`Using dd-trace-dotnet layer: ${lambdaLayerArn}`);
      addLayer(lambdaLayerArn, false, scope, lam, runtime);
      break;

    case RuntimeType.RUBY:
      lambdaLayerArn = tryToFigureOutTracingLayerArn(
        region,
        accountId,
        runtime,
        isARM,
        errors,
        "Ruby",
        "ruby",
        rubyLayerVersion,
        rubyLayerArn,
        DatadogDefaultLayerVersions.RUBY,
      );
      if (lambdaLayerArn === undefined) {
        return errors;
      }

      log.debug(`Using Ruby Lambda layer: ${lambdaLayerArn}`);
      addLayer(lambdaLayerArn, false, scope, lam, runtime);
      break;

    case RuntimeType.CUSTOM:
      break;
  }
  return errors;
}

export function applyExtensionLayer(
  scope: Construct,
  region: string,
  lam: lambda.Function,
  extensionLayerVersion?: number,
  extensionLayerArn?: string,
  useLayersFromAccount?: string,
): string[] {
  // TODO: check region availability
  const errors: string[] = [];
  log.debug("Applying extension layer to Lambda function...");
  const runtime: string = lam.runtime.name;
  const lambdaRuntimeType: RuntimeType = runtimeLookup[runtime];
  const isARM = lam.architecture?.dockerPlatform === Architecture.ARM_64.dockerPlatform;
  const accountId = useLayersFromAccount;

  if (lambdaRuntimeType === undefined || lambdaRuntimeType === RuntimeType.UNSUPPORTED) {
    const error = `Unsupported runtime: ${runtime}`;
    log.warn(error);
    errors.push(error);
    return errors;
  }

  let selectedExtensionLayerArn: string | undefined;
  if (extensionLayerArn === undefined && extensionLayerVersion === undefined) {
    const error = `Must have either extensionLayerArn or extensionLayerVersion defined in order to apply the extension layer`;
    log.warn(error);
    errors.push(error);
    return errors;
  } else if (extensionLayerArn !== undefined && extensionLayerVersion !== undefined) {
    const error = `Cannot have both extensionLayerArn and extensionLayerVersion defined. Please choose one or the other.`;
    log.warn(error);
    errors.push(error);
    return errors;
  } else if (extensionLayerArn !== undefined) {
    selectedExtensionLayerArn = extensionLayerArn;
  } else if (extensionLayerVersion !== undefined) {
    selectedExtensionLayerArn = getExtensionLayerArn(region, extensionLayerVersion, isARM, accountId);
  }

  if (selectedExtensionLayerArn === undefined) {
    const error = `Failed to determine extension layer ARN`;
    log.warn(error);
    errors.push(error);
    return errors;
  }

  log.debug(`Using extension layer: ${selectedExtensionLayerArn}`);
  addLayer(selectedExtensionLayerArn, true, scope, lam, runtime);
  return errors;
}

function tryToFigureOutTracingLayerArn(
  region: string,
  accountId: string | undefined,
  runtime: string,
  isARM: boolean,
  errors: string[],
  formalRuntime: string,
  paramRuntime: string,
  layerVersion?: number,
  layerArn?: string,
  defaultLayerVersion?: number,
): string | undefined {
  let lambdaLayerArn: string | undefined;

  if (layerVersion !== undefined && layerArn !== undefined) {
    const error = `Cannot have both ${paramRuntime}LayerVersion and ${paramRuntime}LayerArn defined. Please choose one or the other.`;
    log.error(error);
    errors.push(error);
    return undefined;
  } else if (layerArn !== undefined) {
    lambdaLayerArn = layerArn;
  } else {
    // Fall back to the default layer version bundled with this construct when
    // neither a version nor an ARN is provided.
    const version = layerVersion ?? defaultLayerVersion;
    if (version !== undefined) {
      lambdaLayerArn = getLambdaLayerArn(region, version, runtime, isARM, accountId);
    }
  }

  if (lambdaLayerArn === undefined) {
    const error = `Failed to determine ${formalRuntime} layer ARN`;
    log.error(error);
    errors.push(error);
    return undefined;
  }

  return lambdaLayerArn;
}

function addLayer(
  layerArn: string,
  isExtensionLayer: boolean,
  scope: Construct,
  lam: lambda.Function,
  runtime: string,
): void {
  const layerId = generateLayerId(isExtensionLayer, lam.functionArn, runtime);

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

export function getLambdaLayerArn(
  region: string,
  version: number,
  runtime: string,
  isArm: boolean,
  accountId?: string,
): string {
  const baseLayerName = runtimeToLayerName[runtime];
  const layerName = isArm ? `${baseLayerName}-ARM` : baseLayerName;
  const partition = getAWSPartitionFromRegion(region);
  // TODO: edge case where gov cloud is the region, but they are using a token so we can't resolve it.
  const isGovCloud = govCloudRegions.includes(region);

  // if this is a GovCloud region, use the GovCloud lambda layer
  if (isGovCloud) {
    log.debug("GovCloud region detected, using the GovCloud lambda layer");
    return `arn:${partition}:lambda:${region}:${accountId ?? DD_GOV_ACCOUNT_ID}:layer:${layerName}:${version}`;
  }
  return `arn:${partition}:lambda:${region}:${accountId ?? DD_ACCOUNT_ID}:layer:${layerName}:${version}`;
}

export function getExtensionLayerArn(region: string, version: number, isArm: boolean, accountId?: string): string {
  const baseLayerName = "Datadog-Extension";
  const layerName = isArm ? `${baseLayerName}-ARM` : baseLayerName;
  const partition = getAWSPartitionFromRegion(region);
  const isGovCloud = govCloudRegions.includes(region);
  if (isGovCloud) {
    log.debug("GovCloud region detected, using the GovCloud extension layer");
    return `arn:${partition}:lambda:${region}:${accountId ?? DD_GOV_ACCOUNT_ID}:layer:${layerName}:${version}`;
  }
  return `arn:${partition}:lambda:${region}:${accountId ?? DD_ACCOUNT_ID}:layer:${layerName}:${version}`;
}

export function generateLambdaLayerId(lambdaFunctionArn: string, runtime: string): string {
  log.debug("Generating construct Id for Datadog Lambda layer");
  const layerValue: string = crypto.createHash("sha256").update(lambdaFunctionArn).digest("hex");
  return `${LAYER_PREFIX}-${runtime}-${layerValue}`;
}

export function generateExtensionLayerId(lambdaFunctionArn: string): string {
  log.debug("Generating construct Id for Datadog Extension layer");
  const layerValue: string = crypto.createHash("sha256").update(lambdaFunctionArn).digest("hex");
  return `${EXTENSION_LAYER_PREFIX}-${layerValue}`;
}

export function generateLayerId(isExtensionLayer: boolean, functionArn: string, runtime: string): string {
  if (isExtensionLayer) {
    return generateExtensionLayerId(functionArn);
  }
  return generateLambdaLayerId(functionArn, runtime);
}

function getAWSPartitionFromRegion(region: string): string {
  if (region.startsWith("us-gov-")) {
    return "aws-us-gov";
  }
  if (region.startsWith("cn-")) {
    return "aws-cn";
  }
  return "aws";
}
