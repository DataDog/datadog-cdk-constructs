import * as lambda from "@aws-cdk/aws-lambda";
import * as logs from "@aws-cdk/aws-logs";
import { Construct } from "@aws-cdk/core";

/**
 * Use a Lamda Function as the destination for a log subscription.
 * Using this class temporarily until https://github.com/aws/aws-cdk/pull/14222 is merged and released.
 */
export class LambdaDestination implements logs.ILogSubscriptionDestination {
  constructor(private readonly fn: lambda.IFunction) {}

  public bind(scope: Construct, logGroup: logs.ILogGroup): logs.LogSubscriptionDestinationConfig {
    scope.toString;
    logGroup.logGroupName; //get around not using the params
    return { arn: this.fn.functionArn };
  }
}

