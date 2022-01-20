import * as lambda from "@aws-cdk/aws-lambda";
import * as logs from "@aws-cdk/aws-logs";

/**
 * Use a Lambda Function as the destination for a log subscription.
 * Using this class temporarily until https://github.com/aws/aws-cdk/pull/14222 is merged and released.
 */


/*
 * File can be deleted once we confirm the aforementioned merge and release of the PR fixes the issue we were having
 */
export class LambdaDestination implements logs.ILogSubscriptionDestination {
  constructor(private readonly fn: lambda.IFunction) {}

  public bind(): logs.LogSubscriptionDestinationConfig {
    return { arn: this.fn.functionArn };
  }
}
