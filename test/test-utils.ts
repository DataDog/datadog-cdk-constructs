import { Function } from "@aws-cdk/aws-lambda";
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

      if (baseConstruct instanceof Function) {
        expect(cfnSubscriptionFilters).toHaveLength(1);
      }

      return {
        id: construct.node.id,
        destinationArn: cfnSubscriptionFilters[0].destinationArn,
      };
    });
};
