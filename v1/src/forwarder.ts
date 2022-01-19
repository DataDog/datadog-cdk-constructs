/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "@aws-cdk/aws-lambda";
import { FilterPattern, ILogGroup } from "@aws-cdk/aws-logs";
// Change back to 'import { LambdaDestination } from "@aws-cdk/aws-logs-destinations";'
// once https://github.com/aws/aws-cdk/pull/14222 is merged and released.
// import { LambdaDestination } from "./lambdaDestination";
import { LambdaDestination } from "@aws-cdk/aws-logs-destinations";
import * as cdk from "@aws-cdk/core";
import log from "loglevel";
import { generateForwarderConstructId, generateSubscriptionFilterName } from "./index";

function getForwarder(scope: cdk.Construct, forwarderArn: string) {
  const forwarderConstructId = generateForwarderConstructId(forwarderArn);
  if (scope.node.tryFindChild(forwarderConstructId)) {
    return scope.node.tryFindChild(forwarderConstructId) as lambda.IFunction;
  } else {
    return lambda.Function.fromFunctionArn(scope, forwarderConstructId, forwarderArn);
  }
}

export function addForwarder(scope: cdk.Construct, lambdaFunctions: lambda.Function[], forwarderArn: string) {
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

export function addForwarderToLogGroups(scope: cdk.Construct, logGroups: ILogGroup[], forwarderArn: string) {
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
