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
export function addForwarder(scope: cdk.Construct, lambdaFunctions: lambda.Function[], forwarderARN: string) {
  const forwarder = lambda.Function.fromFunctionArn(scope, "forwarder", forwarderARN);
  const forwarderDestination = new LambdaDestination(forwarder);
  lambdaFunctions.forEach((lam) => {
    const subscriptionFilterValue: string = crypto.createHash("sha256").update(lam.functionArn).digest("hex");
    const subscriptionFilterValueLength = subscriptionFilterValue.length;
    lam.logGroup.addSubscriptionFilter(
      SUBSCRIPTION_FILTER_PREFIX +
        subscriptionFilterValue.substring(subscriptionFilterValueLength - 8, subscriptionFilterValueLength),
      {
        destination: forwarderDestination,
        filterPattern: FilterPattern.allEvents(),
      },
    );
  });
}
