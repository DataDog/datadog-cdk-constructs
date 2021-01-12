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
import * as crypto from 'crypto';
import { LambdaDestination } from "@aws-cdk/aws-logs-destinations";
const SubscriptionFilterPrefix = "DatadogSubscriptionFilter";
export function addForwarder(
  scope: cdk.Construct,
  lambdaFunctions: lambda.Function[],
  forwarderARN: string,
) {
  const forwarder = lambda.Function.fromFunctionArn(
    scope,
    "forwarder",
    forwarderARN,
  );
  const forwarderDestination = new LambdaDestination(forwarder);
  lambdaFunctions.forEach((l) => {
    let subscriptionFilterValue: string = crypto.createHash('sha256').update(l.functionArn).digest('hex');
    let subscriptionFilterValueLength = subscriptionFilterValue.length;
    l.logGroup.addSubscriptionFilter(
      SubscriptionFilterPrefix +
        subscriptionFilterValue.substring(
          subscriptionFilterValueLength - 8,
          subscriptionFilterValueLength,
        ),
      {
        destination: forwarderDestination,
        filterPattern: FilterPattern.allEvents(),
      },
    );
  });
}
