/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdaNodejs from "@aws-cdk/aws-lambda-nodejs";
import * as lambdaPython from "@aws-cdk/aws-lambda-python";
import * as logs from "@aws-cdk/aws-logs";
import * as cdk from "@aws-cdk/core";
import log from "loglevel";
import { Transport } from "./common/transport";
import {
  addForwarder,
  addForwarderToLogGroups,
  applyEnvVariables,
  applyLayers,
  DatadogProps,
  DatadogStrictProps,
  handleSettingPropDefaults,
  redirectHandlers,
  setDDEnvVariables,
  setGitCommitHashEnvironmentVariable,
  TagKeys,
  validateProps,
} from "./index";

const versionJson = require("../version.json");

export class Datadog extends cdk.Construct {
  scope: cdk.Construct;
  props: DatadogProps;
  transport: Transport;
  constructor(scope: cdk.Construct, id: string, props: DatadogProps) {
    if (process.env.DD_CONSTRUCT_DEBUG_LOGS?.toLowerCase() == "true") {
      log.setLevel("debug");
    }
    super(scope, id);
    this.scope = scope;
    this.props = props;
    validateProps(this.props);
    this.transport = new Transport(
      this.props.flushMetricsToLogs,
      this.props.site,
      this.props.apiKey,
      this.props.apiKeySecretArn,
      this.props.apiKmsKey,
      this.props.extensionLayerVersion,
    );
  }

  public addLambdaFunctions(
    lambdaFunctions: (lambda.Function | lambdaNodejs.NodejsFunction | lambdaPython.PythonFunction)[],
  ) {
    const baseProps: DatadogStrictProps = handleSettingPropDefaults(this.props);

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
      redirectHandlers(lambdaFunctions, baseProps.addLayers);

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

      applyEnvVariables(lambdaFunctions, baseProps);
      setDDEnvVariables(lambdaFunctions, this.props);
      setTags(lambdaFunctions, this.props);

      this.transport.applyEnvVars(lambdaFunctions);
    }
  }

  public addGitCommitMetadata(
    lambdaFunctions: (lambda.Function | lambdaNodejs.NodejsFunction | lambdaPython.PythonFunction)[],
    gitCommitSha: string,
  ) {
    setGitCommitHashEnvironmentVariable(lambdaFunctions, gitCommitSha);
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
    cdk.Tags.of(functionName).add(TagKeys.CDK, `v${versionJson.version}`, {
      includeResourceTypes: ["AWS::Lambda::Function"],
    });
  });
}

function setTags(lambdaFunctions: lambda.Function[], props: DatadogProps) {
  log.debug(`Adding datadog tags`);
  lambdaFunctions.forEach((functionName) => {
    if (props.forwarderArn) {
      if (props.env) {
        cdk.Tags.of(functionName).add(TagKeys.Env, props.env);
      }
      if (props.service) {
        cdk.Tags.of(functionName).add(TagKeys.Service, props.service);
      }
      if (props.version) {
        cdk.Tags.of(functionName).add(TagKeys.Version, props.version);
      }
      if (props.tags) {
        const tagsArray = props.tags.split(",");
        tagsArray.forEach((tag: string) => {
          const [key, value] = tag.split(":");
          if (key && value) {
            cdk.Tags.of(functionName).add(key, value);
          }
        });
      }
    }
  });
}
