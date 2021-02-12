/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { applyLayers, redirectHandlers, addForwarder, applyEnvVariables, defaultEnvVar } from "./index";
import { Transport } from "./transport";

export interface DatadogProps {
  pythonLayerVersion?: number;
  nodeLayerVersion?: number;
  addLayers?: boolean;
  forwarderARN?: string;
  flushMetricsToLogs?: boolean;
  site?: string;
  apiKey?: string;
  apiKMSKey?: string;
  enableDDTracing?: boolean;
  injectLogContext?: boolean;
}

export class Datadog extends cdk.Construct {
  scope: cdk.Construct;
  props: DatadogProps;
  transport: Transport;
  constructor(scope: cdk.Construct, id: string, props: DatadogProps) {
    super(scope, id);
    this.scope = scope;
    this.props = props;
    this.transport = new Transport(
      this.props.flushMetricsToLogs,
      this.props.site,
      this.props.apiKey,
      this.props.apiKMSKey,
    );
  }

  public addLambdaFunctions(lambdaFunctions: lambda.Function[]) {
    if (this.props.addLayers === undefined) {
      this.props.addLayers = defaultEnvVar.addLayers;
    }
    if (this.props.enableDDTracing === undefined) {
      this.props.enableDDTracing = defaultEnvVar.enableDDTracing;
    }
    if (this.props.injectLogContext === undefined) {
      this.props.injectLogContext = defaultEnvVar.injectLogContext;
    }
    if (this.props !== undefined && lambdaFunctions.length > 0) {
      const region = `${lambdaFunctions[0].env.region}`;
      applyLayers(this.scope, region, lambdaFunctions, this.props.pythonLayerVersion, this.props.nodeLayerVersion);
      redirectHandlers(lambdaFunctions, this.props.addLayers);
      if (this.props.forwarderARN !== undefined) {
        addForwarder(this.scope, lambdaFunctions, this.props.forwarderARN);
      }
      applyEnvVariables(lambdaFunctions, this.props.enableDDTracing, this.props.injectLogContext);

      this.transport.setEnvVars(lambdaFunctions);
    }
  }
}
