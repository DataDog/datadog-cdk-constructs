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

export interface DatadogProps {
  lambdaFunctions: lambda.Function[];
  pythonLayerVersion?: number;
  nodeLayerVersion?: number;
  addLayers?: boolean;
  forwarderARN?: string;
  flushMetricsToLogs?: boolean;
  site?: string;
  apiKey?: string;
  apiKMSKey?: string;
  logLevel?: string;
  enableDDTracing?: boolean;
  injectLogContext?: boolean;
}


export class Datadog extends cdk.Construct {
  /** allows accessing the counter function */
  constructor(scope: cdk.Construct, id: string, props: DatadogProps) {
    super(scope, id);
    if (props.addLayers === undefined) {
      props.addLayers = defaultEnvVar.addLayers;
    }
    if (props.flushMetricsToLogs === undefined) {
      props.flushMetricsToLogs = defaultEnvVar.flushMetricsToLogs;
    }
    if (props.site === undefined) {
      props.site = defaultEnvVar.site;
    }
    if (props.site != "datadoghq.com" && props.site != "datadoghq.eu") {
      throw new Error('Invalid site URL. Must be either datadoghq.com or datadoghq.eu.')
    }
    if (props.logLevel === undefined) {
      props.logLevel = defaultEnvVar.logLevel;
    }
    if (props.logLevel != "debug" && props.logLevel != "info") {
      throw new Error('Invalid log level. Must be either info or debug.')
    }
    if (props.enableDDTracing === undefined) {
      props.enableDDTracing = defaultEnvVar.enableDDTracing;
    }
    if ((props.enableDDTracing === true || props.enableDDTracing === undefined) && props.forwarderARN === undefined) {
      throw new Error('A forwarderARN of the Datadog forwarder lambda function is required for Datadog Tracing (enabled by default). This can be disabled by setting enableDDTracing: false.')
    }
    if (props.injectLogContext === undefined) {
      props.injectLogContext = defaultEnvVar.injectLogContext;
    }
    if ((props.apiKey != undefined && props.apiKMSKey != undefined && props.flushMetricsToLogs === false) ||
    (props.apiKey === undefined && props.apiKMSKey === undefined && props.flushMetricsToLogs === false)) {
      throw new Error('The parameters apiKey and apiKMSKey are mutually exclusive. Please set one or the other but not both if flushMetricsToLogs is set to false.')
    };
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
        props.logLevel,
        props.enableDDTracing,
        props.injectLogContext
      )
    }
  }
}
