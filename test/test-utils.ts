import * as lambda from "aws-cdk-lib/aws-lambda";
import { CfnSubscriptionFilter } from "aws-cdk-lib/aws-logs";
import { Construct } from "constructs";
import { SUBSCRIPTION_FILTER_PREFIX } from "../src/index";

export const findDatadogSubscriptionFilters = (baseConstruct: Construct) => {
  // extract lambdaFunction property from Singleton Function
  // using bracket notation here since lambdaFunction is a private property
  const baseConstructModified: Construct = isSingletonFunction(baseConstruct)
    ? baseConstruct["lambdaFunction"] // eslint-disable-line dot-notation
    : baseConstruct;

  return baseConstructModified.node
    .findAll()
    .filter((construct) => construct.node.id.startsWith(SUBSCRIPTION_FILTER_PREFIX))
    .map((construct) => {
      const cfnSubscriptionFilters = construct.node.children.filter(
        (child) => child instanceof CfnSubscriptionFilter,
      ) as CfnSubscriptionFilter[];

      return cfnSubscriptionFilters.map((cfnSubcriptionFilter) => {
        return {
          id: construct.node.id,
          destinationArn: cfnSubcriptionFilter.destinationArn,
        };
      });
    })
    .reduce((acc, subscriptionFilters) => acc.concat(subscriptionFilters), []);
};

function isSingletonFunction(fn: Construct): fn is lambda.SingletonFunction {
  return fn.hasOwnProperty("lambdaFunction");
}
