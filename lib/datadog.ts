/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { applyLayers, redirectHandlers, addForwarder } from "./index";

export interface DatadogProps {
  pythonLayerVersion?: number;
  nodeLayerVersion?: number;
  addLayers?: boolean;
  forwarderARN?: string;
}

export class Datadog extends cdk.Construct {
  /** allows accessing the counter function */
  scope: cdk.Construct;
  props: DatadogProps;
  constructor(scope: cdk.Construct, id: string, props: DatadogProps) {
    super(scope, id);
    this.scope = scope;
    this.props = props;
  }

  public addLambdaFunctions(lambdaFunctions: lambda.Function[]) {
    if (this.props.addLayers === undefined) {
      this.props.addLayers = true;
    }
    if (this.props != undefined && lambdaFunctions.length > 0) {
      const region = `${lambdaFunctions[0].env.region}`;
      applyLayers(
        this.scope,
        region,
        lambdaFunctions,
        this.props.pythonLayerVersion,
        this.props.nodeLayerVersion,
      );
      redirectHandlers(lambdaFunctions, this.props.addLayers);
      if (this.props.forwarderARN != undefined) {
        addForwarder(this.scope, lambdaFunctions, this.props.forwarderARN);
      }
    }
  }
}
