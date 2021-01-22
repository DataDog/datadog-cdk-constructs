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

export const site_list: string[] = [
  "datadoghq.com",
  "datadoghq.eu",
  "us3.datadoghq.com",
  "ddog-gov.com"
]

export class Datadog extends cdk.Construct {
  scope: cdk.Construct;
  props: DatadogProps
  constructor(scope: cdk.Construct, id: string, props: DatadogProps) {
    super(scope, id);
    this.scope = scope;
    this.props = props;
  }

  public addLambdaFunctions(lambdaFunctions: lambda.Function[]){
    if (this.props.addLayers === undefined) {
      this.props.addLayers = defaultEnvVar.addLayers;
    }
    if (this.props.flushMetricsToLogs === undefined) {
      this.props.flushMetricsToLogs = defaultEnvVar.flushMetricsToLogs;
    }
    if (this.props.flushMetricsToLogs === false && this.props.site === undefined) {
      throw new Error('A site is required if flushMetricsToLogs is set to false.');
    }
    if (this.props.site === undefined) {
      this.props.site = defaultEnvVar.site;
    }
    if (!(site_list.includes(this.props.site))) {
      throw new Error('Invalid site URL. Must be either datadoghq.com, datadoghq.eu, us3.datadoghq.com, or ddog-gov.com.')
    }
    if ((this.props.apiKey != undefined && this.props.apiKMSKey != undefined && this.props.flushMetricsToLogs === false) ||
    (this.props.apiKey === undefined && this.props.apiKMSKey === undefined && this.props.flushMetricsToLogs === false)) {
      throw new Error('The parameters apiKey and apiKMSKey are mutually exclusive. Please set one or the other but not both if flushMetricsToLogs is set to false.')
    };
    if (this.props.enableDDTracing === undefined) {
      this.props.enableDDTracing = defaultEnvVar.enableDDTracing;
    }
    if ((this.props.enableDDTracing === true || this.props.enableDDTracing === undefined) && this.props.forwarderARN === undefined) {
      throw new Error('A forwarderARN of the Datadog forwarder lambda function is required for Datadog Tracing (enabled by default). This can be disabled by setting enableDDTracing: false.')
    }
    if (this.props.injectLogContext === undefined) {
      this.props.injectLogContext = defaultEnvVar.injectLogContext;
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
      applyEnvVariables(
        lambdaFunctions,
        this.props.flushMetricsToLogs,
        this.props.site,
        this.props.apiKey,
        this.props.apiKMSKey,
        this.props.enableDDTracing,
        this.props.injectLogContext
      )
    }
  }
}
