/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
import * as logs from "@aws-cdk/aws-logs";
import * as cdk from "@aws-cdk/core";
import log from "loglevel";
import { applyLayers, redirectHandlers, addForwarder, addForwarderToLogGroups, applyEnvVariables } from "./index";
import { Transport } from "./transport";
const versionJson = require("../version.json");

export interface DatadogProps {
  readonly pythonLayerVersion?: number;
  readonly nodeLayerVersion?: number;
  readonly extensionLayerVersion?: number;
  readonly addLayers?: boolean;
  readonly forwarderArn?: string;
  readonly flushMetricsToLogs?: boolean;
  readonly site?: string;
  readonly apiKey?: string;
  readonly apiKmsKey?: string;
  readonly enableDatadogTracing?: boolean;
  readonly injectLogContext?: boolean;
  readonly logLevel?: string;
  readonly enableDatadogLogs?: boolean;
}

enum TagKeys {
  Cdk = "dd_cdk_construct",
}

export const defaultProps = {
  addLayers: true,
  enableDatadogTracing: true,
  injectLogContext: true,
  enableDatadogLogs: true,
};

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
      this.props.apiKmsKey,
      this.props.extensionLayerVersion,
    );
  }

  public addLambdaFunctions(lambdaFunctions: lambda.Function[]) {
    let addLayers = this.props.addLayers;
    let enableDatadogTracing = this.props.enableDatadogTracing;
    let injectLogContext = this.props.injectLogContext;
    const logLevel = this.props.logLevel;
    let enableDatadogLogs = this.props.enableDatadogLogs;

    if (addLayers === undefined) {
      log.debug(`No value provided for addLayers, defaulting to ${defaultProps.addLayers}`);
      addLayers = defaultProps.addLayers;
    }
    if (enableDatadogTracing === undefined) {
      log.debug(`No value provided for enableDatadogTracing, defaulting to ${defaultProps.enableDatadogTracing}`);
      enableDatadogTracing = defaultProps.enableDatadogTracing;
    }
    if (injectLogContext === undefined) {
      log.debug(`No value provided for injectLogContext, defaulting to ${defaultProps.injectLogContext}`);
      injectLogContext = defaultProps.injectLogContext;
    }
    if (logLevel === undefined) {
      log.debug(`No value provided for logLevel`);
    }
    if (enableDatadogLogs === undefined) {
      log.debug(`No value provided for enableDatadogLogs, defaulting to ${defaultProps.enableDatadogLogs}`);
      enableDatadogLogs = defaultProps.enableDatadogLogs;
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

      if (this.props.forwarderArn !== undefined) {
        if (this.props.extensionLayerVersion !== undefined) {
          log.debug(`Skipping adding subscriptions to the lambda log groups since the extension is enabled`);
        } else {
          log.debug(`Adding log subscriptions using provided Forwarder ARN: ${this.props.forwarderArn}`);
          addForwarder(this.scope, lambdaFunctions, this.props.forwarderArn);
        }
      } else {
        log.debug("Forwarder ARN not provided, no log group subscriptions will be added");
      }

      addCdkConstructVersionTag(lambdaFunctions);

      applyEnvVariables(lambdaFunctions, enableDatadogTracing, injectLogContext, enableDatadogLogs, logLevel);
      this.transport.applyEnvVars(lambdaFunctions);
    }
  }

  public addForwarderToNonLambdaLogGroups(logGroups: logs.ILogGroup[]) {
    if (this.props.forwarderArn !== undefined) {
      addForwarderToLogGroups(this.scope, logGroups, this.props.forwarderArn);
    } else {
      log.debug("Forwarder ARN not provided, no non lambda log group subscriptions will be added");
    }
  }
}

export function addCdkConstructVersionTag(lambdaFunctions: lambda.Function[]) {
  log.debug(`Adding CDK Construct version tag: ${versionJson.version}`);
  lambdaFunctions.forEach((functionName) => {
    cdk.Tags.of(functionName).add(TagKeys.Cdk, `v${versionJson.version}`, {
      includeResourceTypes: ["AWS::Lambda::Function"],
    });
  });
}

function validateProps(props: DatadogProps) {
  log.debug("Validating props...");
  const siteList: string[] = ["datadoghq.com", "datadoghq.eu", "us3.datadoghq.com", "us5.datadoghq.com", "ddog-gov.com"];
  if (props.apiKey !== undefined && props.apiKmsKey !== undefined) {
    throw new Error("Both `apiKey` and `apiKmsKey` cannot be set.");
  }

  if (props.site !== undefined && !siteList.includes(props.site.toLowerCase())) {
    throw new Error(
      "Warning: Invalid site URL. Must be either datadoghq.com, datadoghq.eu, us3.datadoghq.com, us5.datadoghq.com, or ddog-gov.com.",
    );
  }

  if (props.apiKey === undefined && props.apiKmsKey === undefined && props.flushMetricsToLogs === false) {
    throw new Error("When `flushMetricsToLogs` is false, `apiKey` or `apiKmsKey` must also be set.");
  }
  if (props.extensionLayerVersion !== undefined) {
    if (props.apiKey === undefined && props.apiKmsKey === undefined) {
      throw new Error("When `extensionLayer` is set, `apiKey` or `apiKmsKey` must also be set.");
    }
  }
}
