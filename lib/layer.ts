import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
export const DD_ACCOUNT_ID = "464622532012";
export const DD_GOV_ACCOUNT_ID = "002406178527";

export enum RuntimeType {
  NODE,
  PYTHON,
  UNSUPPORTED,
}

// Self defined interface that only applies to the macro - the FunctionProperties interface
// defined in index.ts matches the CloudFormation AWS::Lambda::Function Properties interface.

const availableRegions = new Set([
  "us-east-2",
  "us-east-1",
  "us-west-1",
  "us-west-2",
  "ap-east-1",
  "ap-south-1",
  "ap-northeast-2",
  "ap-southeast-1",
  "ap-southeast-2",
  "ap-northeast-1",
  "ca-central-1",
  "eu-north-1",
  "eu-central-1",
  "eu-west-1",
  "eu-west-2",
  "eu-west-3",
  "sa-east-1",
  "us-gov-east-1",
  "us-gov-west-1",
]);

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
  ) {
    //Dacry: check for available region
    // if (!availableRegions.has(region)) {
    //   return [];
    // }
    const errors: string[] = [];
    let layerValue: number = 0;
    lambdas.forEach((l) => {
      let runtime: string = l.runtime.name + '';
      let lambdaRuntimeType: RuntimeType = runtimeLookup[runtime];
      if (lambdaRuntimeType === RuntimeType.UNSUPPORTED) {
        return;
      }
  
      let layerARN;
  
      if (lambdaRuntimeType === RuntimeType.PYTHON) {
        if (pythonLayerVersion === undefined) {
          errors.push(getMissingLayerVersionErrorMsg(l.toString(), "Python", "python"));
          return;
        }
        layerARN = getLayerARN(region, pythonLayerVersion, runtime);
      }
  
      if (lambdaRuntimeType === RuntimeType.NODE) {
        if (nodeLayerVersion === undefined) {
          errors.push(getMissingLayerVersionErrorMsg(l.toString(), "Node.js", "node"));
          return;
        }
        layerARN = getLayerARN(region, nodeLayerVersion, runtime);
      }
      if (layerARN !== undefined) {
        var layer = layers.get(layerARN);
        if (layer === undefined)
        {
          layer = lambda.LayerVersion.fromLayerVersionArn(scope, "layer" + layerValue, layerARN);
          layers.set(layerARN, layer) // could have token in key string
          layerValue+=1;
        }
        //Darcy: check if layer continues to not exist
        l.addLayers(layer)   
      }
    });
    return errors;
  }
  
  function getLayerARN(region: string, version: number, runtime: string) {
    const layerName = runtimeToLayerName[runtime];
    const isGovCloud = region === "us-gov-east-1" || region === "us-gov-west-1";
  
    // if this is a GovCloud region, use the GovCloud lambda layer
    if (isGovCloud) {
      return `arn:aws-us-gov:lambda:${region}:${DD_GOV_ACCOUNT_ID}:layer:${layerName}:${version}`;
    }
    return `arn:aws:lambda:${region}:${DD_ACCOUNT_ID}:layer:${layerName}:${version}`;
  }
  
  function getMissingLayerVersionErrorMsg(functionKey: string, formalRuntime: string, paramRuntime: string) {
    return (
      `Resource ${functionKey} has a ${formalRuntime} runtime, but no ${formalRuntime} Lambda Library version was provided. ` +
      `Please add the '${paramRuntime}LayerVersion' parameter for the Datadog serverless macro.`
    );
  }