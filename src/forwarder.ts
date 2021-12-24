/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as crypto from "crypto";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { FilterPattern, ILogGroup } from "aws-cdk-lib/aws-logs";
import * as cdk from "aws-cdk-lib/core";
import { Construct } from "constructs";
import log from "loglevel";
export const SUBSCRIPTION_FILTER_PREFIX = "DatadogSubscriptionFilter";
// Change back to 'import { LambdaDestination } from "aws-cdk-lib/aws-logs-destinations";'
// once https://github.com/aws/aws-cdk/pull/14222 is merged and released.
import { LambdaDestination } from "./lambdaDestination";

function generateForwarderConstructId(forwarderArn: string) {
  log.debug("Generating construct Id for Datadog Lambda Forwarder");
  return "forwarder" + crypto.createHash("sha256").update(forwarderArn).digest("hex");
}
function generateSubscriptionFilterName(functionUniqueId: string, forwarderArn: string) {
  const subscriptionFilterValue: string = crypto
    .createHash("sha256")
    .update(functionUniqueId)
    .update(forwarderArn)
    .digest("hex");
  const subscriptionFilterValueLength = subscriptionFilterValue.length;
  const subscriptionFilterName =
    SUBSCRIPTION_FILTER_PREFIX +
    subscriptionFilterValue.substring(subscriptionFilterValueLength - 8, subscriptionFilterValueLength);

  return subscriptionFilterName;
}

function getForwarder(scope: Construct, forwarderArn: string) {
  const forwarderConstructId = generateForwarderConstructId(forwarderArn);
  if (scope.node.tryFindChild(forwarderConstructId)) {
    return scope.node.tryFindChild(forwarderConstructId) as lambda.IFunction;
  } else {
    return lambda.Function.fromFunctionArn(scope, forwarderConstructId, forwarderArn);
  }
}

export function addForwarder(scope: Construct, lambdaFunctions: lambda.Function[], forwarderArn: string) {
  const forwarder = getForwarder(scope, forwarderArn);
  const forwarderDestination = new LambdaDestination(forwarder);
  lambdaFunctions.forEach((lam) => {
    const subscriptionFilterName = generateSubscriptionFilterName(cdk.Names.uniqueId(lam), forwarderArn);
    log.debug(`Adding log subscription ${subscriptionFilterName} for ${lam.functionName}`);
    lam.logGroup.addSubscriptionFilter(subscriptionFilterName, {
      destination: forwarderDestination,
      filterPattern: FilterPattern.allEvents(),
    });
  });
}

export function addForwarderToLogGroups(scope: Construct, logGroups: ILogGroup[], forwarderArn: string) {
  const forwarder = getForwarder(scope, forwarderArn);
  const forwarderDestination = new LambdaDestination(forwarder);
  logGroups.forEach((group) => {
    const subscriptionFilterName = generateSubscriptionFilterName(cdk.Names.nodeUniqueId(group.node), forwarderArn);
    group.addSubscriptionFilter(subscriptionFilterName, {
      destination: forwarderDestination,
      filterPattern: FilterPattern.allEvents(),
    });
  });
}
