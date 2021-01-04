import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { FilterPattern } from "@aws-cdk/aws-logs";
import { LambdaDestination } from "@aws-cdk/aws-logs-destinations";
const SubscriptionFilterPrefix = "DatadogSubscriptionFilter";
let subscriptionFilterValue = 0;
export function addForwarder(
  scope: cdk.Construct,
  lambdaFunctions: lambda.Function[],
  forwarderARN: string
) {
  const forwarder = lambda.Function.fromFunctionArn(
    scope,
    "forwarder",
    forwarderARN
  );
  const forwarderDestination = new LambdaDestination(forwarder);
  lambdaFunctions.forEach((l) => {
    l.logGroup.addSubscriptionFilter(
      SubscriptionFilterPrefix + subscriptionFilterValue,
      {
        destination: forwarderDestination,
        filterPattern: FilterPattern.allEvents(),
      }
    );
    subscriptionFilterValue += 1;
  });
}
