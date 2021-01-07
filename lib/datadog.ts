import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { applyLayers, redirectHandlers, addForwarder } from "./index";

export interface DatadogProps {
  lambdaFunctions: lambda.Function[];
  pythonLayerVersion?: number;
  nodeLayerVersion?: number;
  addLayers?: boolean;
  forwarderARN?: string;
}

export class Datadog extends cdk.Construct {
  /** allows accessing the counter function */
  scope: cdk.Construct;
  constructor(scope: cdk.Construct, id: string, props?: DatadogProps) {
    super(scope, id);
    this.scope = scope;
    if (props != undefined) {
      this.addLambdaFunction(props);
    }
  }

  public addLambdaFunction(props: DatadogProps) {
    if (props.addLayers === undefined) {
      props.addLayers = true;
    }
    if (props != undefined && props.lambdaFunctions.length > 0) {
      const region = `${props.lambdaFunctions[0].env.region}`;
      applyLayers(
        this.scope,
        region,
        props.lambdaFunctions,
        props.pythonLayerVersion,
        props.nodeLayerVersion
      );
      redirectHandlers(props.lambdaFunctions, props.addLayers);
      if (props.forwarderARN != undefined) {
        addForwarder(this.scope, props.lambdaFunctions, props.forwarderARN);
      }
    }
  }
}
