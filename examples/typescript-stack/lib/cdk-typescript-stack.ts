import { StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { DatadogLambda, DatadogAppSecMode, DatadogLambdaProps } from "datadog-cdk-constructs-v2";
import { CdkTypeScriptStackBase } from "./cdk-typescript-stack-base";

export class CdkTypeScriptStack extends CdkTypeScriptStackBase {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    console.log("Instrumenting Lambda Functions in TypeScript stack with Datadog");

    const datadogLambdaProps: DatadogLambdaProps = {
      dotnetLayerVersion: 23,
      nodeLayerVersion: 108,
      pythonLayerVersion: 89,
      extensionLayerVersion: 55,
      addLayers: true,
      apiKey: process.env.DD_API_KEY,
      enableDatadogTracing: true,
      datadogAppSecMode: DatadogAppSecMode.ON,
      flushMetricsToLogs: true,
      site: "datadoghq.com",
    };

    const datadog = new DatadogLambda(this, "Datadog", datadogLambdaProps);

    datadog.addLambdaFunctions(this.lambdaFunctions);
  }
}
