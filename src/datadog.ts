/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import log from "loglevel";
import { applyLayers, redirectHandlers, addForwarder, applyEnvVariables, defaultEnvVar } from "./index";
import { Transport } from "./transport";

export interface DatadogProps {
  readonly pythonLayerVersion?: number;
  readonly nodeLayerVersion?: number;
  readonly extensionLayerVersion?: number;
  readonly addLayers?: boolean;
  readonly forwarderARN?: string;
  readonly flushMetricsToLogs?: boolean;
  readonly site?: string;
  readonly apiKey?: string;
  readonly apiKMSKey?: string;
  readonly enableDDTracing?: boolean;
  readonly injectLogContext?: boolean;
}

export class Datadog extends cdk.Construct {
  scope: cdk.Construct;
  props: DatadogProps;
  transport: Transport;
  constructor(scope: cdk.Construct, id: string, props: DatadogProps) {
    if (process.env.DD_CONSTRUCT_DEBUG_LOGS == "true") log.setLevel("debug");
    super(scope, id);
    this.scope = scope;
    this.props = props;
    validateProps(this.props);
    this.transport = new Transport(
      this.props.flushMetricsToLogs,
      this.props.site,
      this.props.apiKey,
      this.props.apiKMSKey,
      this.props.extensionLayerVersion,
    );
  }

  public addLambdaFunctions(lambdaFunctions: lambda.Function[]) {
    let addLayers = this.props.addLayers;
    let enableDDTracing = this.props.enableDDTracing;
    let injectLogContext = this.props.injectLogContext;
    if (addLayers === undefined) {
      log.debug(`No value provided for addLayers, defaulting to ${defaultEnvVar.addLayers}`);
      addLayers = defaultEnvVar.addLayers;
    }
    if (enableDDTracing === undefined) {
      log.debug(`No value provided for enableDDTracing, defaulting to ${defaultEnvVar.enableDDTracing}`);
      enableDDTracing = defaultEnvVar.enableDDTracing;
    }
    if (injectLogContext === undefined) {
      log.debug(`No value provided for injectLogContext, defaulting to ${defaultEnvVar.injectLogContext}`);
      injectLogContext = defaultEnvVar.injectLogContext;
    }
    if (this.props !== undefined && lambdaFunctions.length > 0) {
      const region = `${lambdaFunctions[0].env.region}`;
      log.debug(`Using region: ${region}`);
      applyLayers(
        this.scope,
        region,
        lambdaFunctions,
        this.props.pythonLayerVersion,
        this.props.nodeLayerVersion,
        this.props.extensionLayerVersion,
      );
      redirectHandlers(lambdaFunctions, addLayers);
      if (this.props.forwarderARN !== undefined) {
        log.debug(`Adding log subscriptions using provided Forwarder ARN: ${this.props.forwarderARN}`);
        addForwarder(this.scope, lambdaFunctions, this.props.forwarderARN);
      } else {
        log.debug("Forwarder ARN not provided, no log group subscriptions will be added");
      }
      applyEnvVariables(lambdaFunctions, enableDDTracing, injectLogContext);

      this.transport.applyEnvVars(lambdaFunctions);
    }
  }
}

function validateProps(props: DatadogProps) {
  log.debug("Validating props...");
  const siteList: string[] = ["datadoghq.com", "datadoghq.eu", "us3.datadoghq.com", "ddog-gov.com"];
  if (props.apiKey !== undefined && props.apiKMSKey !== undefined) {
    throw new Error("Both `apiKey` and `apiKMSKey` cannot be set.");
  }

  if (props.site !== undefined && !siteList.includes(props.site.toLowerCase())) {
    throw new Error(
      "Warning: Invalid site URL. Must be either datadoghq.com, datadoghq.eu, us3.datadoghq.com, or ddog-gov.com.",
    );
  }

  if (props.apiKey === undefined && props.apiKMSKey === undefined && props.flushMetricsToLogs === false) {
    throw new Error("When `flushMetricsToLogs` is false, `apiKey` or `apiKMSKey` must also be set.");
  }

  if (props.extensionLayerVersion !== undefined) {
    if (props.forwarderARN !== undefined) {
      throw new Error("`extensionLayerVersion` and `forwarderArn` cannot be set at the same time.");
    }
    if (props.apiKey === undefined && props.apiKMSKey === undefined) {
      throw new Error("When `extensionLayer` is set, `apiKey` or `apiKMSKey` must also be set.");
    }
  }
}
