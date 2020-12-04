import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import {applyLayers, redirectHandlers} from './index'

export interface DatadogProps {
  downstreams: lambda.Function[];
  pythonLayerVersion?: number;
  nodeLayerVersion?: number;
  addLayers: boolean;
}

export class DatadogCDKStack extends cdk.Construct {
  /** allows accessing the counter function */
  public readonly handler: lambda.Function;

  constructor(scope: cdk.Construct, id: string
    , props: DatadogProps
    ) {
    super(scope, id);
    //takes in region of first lambda function
    if (props != undefined)
    {
    const region: string = props.downstreams[0].env.region;
    applyLayers(scope, region, props.downstreams, props.pythonLayerVersion, props.nodeLayerVersion);
    redirectHandlers(props.downstreams,props.addLayers)
    }
  }
}



