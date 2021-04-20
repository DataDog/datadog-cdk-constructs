import { CfnSubscriptionFilter } from "@aws-cdk/aws-logs";
import * as cdk from "@aws-cdk/core";
import { SUBSCRIPTION_FILTER_PREFIX } from "../src/forwarder";

export const findDatadogSubscriptionFilters = (baseConstruct: cdk.Construct) => {
  return baseConstruct.node
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
