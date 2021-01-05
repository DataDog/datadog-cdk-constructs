import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import { FilterPattern } from "@aws-cdk/aws-logs";
import { Md5 } from "ts-md5/dist/md5";
import { LambdaDestination } from "@aws-cdk/aws-logs-destinations";
const SubscriptionFilterPrefix = "DatadogSubscriptionFilter";
// let subscriptionFilterValue = 0;
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
    const subscriptionFilterValue = Md5.hashStr(l.functionArn).toString();
    const subscriptionFilterValueLengnth = subscriptionFilterValue.length;
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
