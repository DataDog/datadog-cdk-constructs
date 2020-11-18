import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
export const DD_HANDLER_ENV_VAR = "DD_LAMBDA_HANDLER";
export const PYTHON_HANDLER = "datadog_lambda.handler.handler";
export const JS_HANDLER_WITH_LAYERS = "/opt/nodejs/node_modules/datadog-lambda-js/handler.handler";
export const JS_HANDLER = "node_modules/datadog-lambda-js/dist/handler.handler";

export interface DatadogProps {
  /** the function for which we want to count url hits **/
  downstream: lambda.Function;
}

export class DatadogCDK extends cdk.Construct {
  /** allows accessing the counter function */
  public readonly handler: lambda.Function;

  constructor(scope: cdk.Construct, id: string, props: DatadogProps) {
    super(scope, id);
    const cfnFunction = props.downstream.node.defaultChild as lambda.CfnFunction;
    
    // creating layer
    const layer = new lambda.LayerVersion(this, 'MyLayer', {
      code: lambda.Code.fromAsset('.layers'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_10_X],
      license: 'Apache-2.0',
      description: 'A layer to test the L2 construct',
    });

    //adding layer
    props.downstream.addLayers(layer)

    //switching handlers
    const originalHandler = cfnFunction.handler;
    cfnFunction.handler = JS_HANDLER_WITH_LAYERS;
    props.downstream.addEnvironment(DD_HANDLER_ENV_VAR,originalHandler);

  }
}
