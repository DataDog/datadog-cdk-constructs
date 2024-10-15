import { Construct } from "constructs";
import { DatadogLambda } from "./datadog-lambda";
import { DatadogProps } from "./index";

/**
 * For backward compatibility. It's recommended to use DatadogLambda for
 * users who want to add Datadog monitoring for Lambda functions.
 */
export class Datadog extends DatadogLambda {
  // Explicitly make the constructor accept DatadogProps, otherwise in the
  // Go package, NewDatadog() will only take DatadogLambdaProps and won't take
  // DatadogProps.
  constructor(scope: Construct, id: string, props: DatadogProps) {
    super(scope, id, props);
  }
}
