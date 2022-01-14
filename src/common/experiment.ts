import * as crypto from "crypto";
import log from "loglevel";
import {
  DatadogProps,
  runtimeToLayerName,
  DD_GOV_ACCOUNT_ID,
  DD_ACCOUNT_ID,
  LAYER_PREFIX,
  EXTENSION_LAYER_PREFIX,
} from "../index";

export function getLambdaLayerArn(region: string, version: number, runtime: string, isArm: boolean, isNode: boolean) {
  const baseLayerName = runtimeToLayerName[runtime];
  const layerName = isArm && !isNode ? `${baseLayerName}-ARM` : baseLayerName;
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
  return LAYER_PREFIX + "-" + runtime + "-" + layerValue;
}

export function generateExtensionLayerId(lambdaFunctionArn: string) {
  log.debug("Generating construct Id for Datadog Extension layer");
  const layerValue: string = crypto.createHash("sha256").update(lambdaFunctionArn).digest("hex");
  return EXTENSION_LAYER_PREFIX + "-" + layerValue;
}

export function validateProps(props: DatadogProps) {
  log.debug("Validating props...");

  checkForMultipleApiKeys(props);
  const siteList: string[] = [
    "datadoghq.com",
    "datadoghq.eu",
    "us3.datadoghq.com",
    "us5.datadoghq.com",
    "ddog-gov.com",
  ];
  if (props.site !== undefined && !siteList.includes(props.site.toLowerCase())) {
    throw new Error(
      "Warning: Invalid site URL. Must be either datadoghq.com, datadoghq.eu, us3.datadoghq.com, us5.datadoghq.com, or ddog-gov.com.",
    );
  }

  if (
    props.apiKey === undefined &&
    props.apiKmsKey === undefined &&
    props.apiKeySecretArn === undefined &&
    props.flushMetricsToLogs === false
  ) {
    throw new Error(
      "When `flushMetricsToLogs` is false, `apiKey`, `apiKeySecretArn`, or `apiKmsKey` must also be set.",
    );
  }
  if (props.extensionLayerVersion !== undefined) {
    if (props.apiKey === undefined && props.apiKeySecretArn === undefined && props.apiKmsKey === undefined) {
      throw new Error("When `extensionLayer` is set, `apiKey`, `apiKeySecretArn`, or `apiKmsKey` must also be set.");
    }
  }
}

export function checkForMultipleApiKeys(props: DatadogProps) {
  let multipleApiKeysMessage;
  if (props.apiKey !== undefined && props.apiKmsKey !== undefined && props.apiKeySecretArn !== undefined) {
    multipleApiKeysMessage = "`apiKey`, `apiKmsKey`, and `apiKeySecretArn`";
  } else if (props.apiKey !== undefined && props.apiKmsKey !== undefined) {
    multipleApiKeysMessage = "`apiKey` and `apiKmsKey`";
  } else if (props.apiKey !== undefined && props.apiKeySecretArn !== undefined) {
    multipleApiKeysMessage = "`apiKey` and `apiKeySecretArn`";
  } else if (props.apiKmsKey !== undefined && props.apiKeySecretArn !== undefined) {
    multipleApiKeysMessage = "`apiKmsKey` and `apiKeySecretArn`";
  }

  if (multipleApiKeysMessage) {
    throw new Error(`${multipleApiKeysMessage} should not be set at the same time.`);
  }
}
