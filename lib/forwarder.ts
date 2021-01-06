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
    let subscriptionFilterValue: string = crypto.createHash('md5').update(l.functionArn).digest('hex');
    let subscriptionFilterValueLengnth = subscriptionFilterValue.length;
    l.logGroup.addSubscriptionFilter(
      SubscriptionFilterPrefix +
        subscriptionFilterValue.substring(
          subscriptionFilterValueLengnth - 8,
          subscriptionFilterValueLengnth,
        ),
      {
        destination: forwarderDestination,
        filterPattern: FilterPattern.allEvents(),
      },
    );
  });
}
