/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { applyLayers, redirectHandlers, addForwarder, applyEnvVariables } from "./index";

export interface DatadogProps {
  lambdaFunctions: lambda.Function[];
  pythonLayerVersion?: number;
  nodeLayerVersion?: number;
  addLayers?: boolean;
  forwarderARN?: string;
  flushMetricsToLogs?: boolean;
  site?: string;
  apiKey?: string | undefined;
  apiKMSKey?: string | undefined;
  logLevel?: string;
}

export class Datadog extends cdk.Construct {
  /** allows accessing the counter function */
  constructor(scope: cdk.Construct, id: string, props: DatadogProps) {
    super(scope, id);
    if (props.addLayers === undefined) {
      props.addLayers = true;
    }
    if (props.flushMetricsToLogs === undefined) {
      props.flushMetricsToLogs = true;
    }
    if (props.site === undefined) {
      props.site = "datadoghq.com"
    }
    if (props.site != "datadoghq.com" && props.site != "datadoghq.eu") {
      throw new Error('Site URL must be either datadoghq.com or datadoghq.eu')
    }
    if (props.logLevel === undefined) {
      props.logLevel = "info"
    }
    if (props.logLevel != "debug" && props.logLevel != "info") {
      throw new Error('Log level must be either info or debug')
    }
    if (props != undefined && props.lambdaFunctions.length > 0) {
      const region = `${props.lambdaFunctions[0].env.region}`;
      applyLayers(
        scope,
        region,
        props.lambdaFunctions,
        props.pythonLayerVersion,
        props.nodeLayerVersion,
      );
      redirectHandlers(props.lambdaFunctions, props.addLayers);
      if (props.forwarderARN != undefined) {
        addForwarder(scope, props.lambdaFunctions, props.forwarderARN);
      }
      applyEnvVariables(
        props.lambdaFunctions,
        props.flushMetricsToLogs,
        props.site,
        props.apiKey,
        props.apiKMSKey,
        props.logLevel
        )
    }
  }
}
