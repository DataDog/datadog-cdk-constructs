/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { FilterPattern } from "@aws-cdk/aws-logs";
import * as crypto from "crypto";
import { LambdaDestination } from "@aws-cdk/aws-logs-destinations";
const SUBSCRIPTION_FILTER_PREFIX = "DatadogSubscriptionFilter";

function generateForwaderConstructId(forwarderArn: string) {
  return "forwarder" + crypto.createHash("sha256").update(forwarderArn).digest("hex");
}
function generateSubscriptionFilterName(functionArn: string, forwarderArn: string) {
  const subscriptionFilterValue: string = crypto
    .createHash("sha256")
    .update(functionArn)
    .update(forwarderArn)
    .digest("hex");
  const subscriptionFilterValueLength = subscriptionFilterValue.length;
  const subscriptionFilterName =
    SUBSCRIPTION_FILTER_PREFIX +
    subscriptionFilterValue.substring(subscriptionFilterValueLength - 8, subscriptionFilterValueLength);

  return subscriptionFilterName;
}

export function addForwarder(scope: cdk.Construct, lambdaFunctions: lambda.Function[], forwarderArn: string) {
  const forwarderConstructId = generateForwaderConstructId(forwarderArn);
  let forwarder;
  if (scope.node.tryFindChild(forwarderConstructId)) {
    forwarder = scope.node.tryFindChild(forwarderConstructId) as lambda.IFunction;
  } else {
    forwarder = lambda.Function.fromFunctionArn(scope, forwarderConstructId, forwarderArn);
  }
  const forwarderDestination = new LambdaDestination(forwarder);
  lambdaFunctions.forEach((lam) => {
    const subscriptionFilterName = generateSubscriptionFilterName(lam.functionArn, forwarderArn);
    lam.logGroup.addSubscriptionFilter(subscriptionFilterName, {
      destination: forwarderDestination,
      filterPattern: FilterPattern.allEvents(),
    });
  });
}
