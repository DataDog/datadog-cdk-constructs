package com.datadoghq.example;

import software.amazon.awscdk.App;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.FunctionUrl;
import software.amazon.awscdk.services.lambda.FunctionUrlAuthType;
import software.amazon.awscdk.services.lambda.FunctionUrlOptions;
import software.amazon.awscdk.services.lambda.Runtime;
import software.constructs.Construct;
import com.datadoghq.cdkconstructs.DatadogLambda;
import com.datadoghq.cdkconstructs.DatadogLambdaProps;

public class App {
    public static void main(final String[] args) {
        App app = new App();

        new CdkJavaStack(app, "CdkJavaStack", StackProps.builder()
                .env(Environment.builder()
                        .account("425362996713")
                        .region("sa-east-1")
                        .build())
                .build());

        app.synth();
    }

    static class CdkJavaStack extends Stack {
        public CdkJavaStack(final Construct scope, final String id, final StackProps props) {
            super(scope, id, props);

            // Create a Lambda function
            Function myFunction = Function.Builder.create(this, "HelloWorldFunction")
                    .runtime(Runtime.NODEJS_20_X)
                    .handler("index.handler")
                    .code(Code.fromInline(
                            "exports.handler = async function(event) { " +
                            "return { statusCode: 200, body: JSON.stringify('Hello World!') }; " +
                            "};"
                    ))
                    .build();

            // Add function URL
            FunctionUrl myFunctionUrl = myFunction.addFunctionUrl(
                    FunctionUrlOptions.builder()
                            .authType(FunctionUrlAuthType.NONE)
                            .build()
            );

            // CloudFormation output for the URL
            CfnOutput.Builder.create(this, "myFunctionUrlOutput")
                    .value(myFunctionUrl.getUrl())
                    .build();

            // Set up Datadog integration
            String ddApiKey = System.getenv("DD_API_KEY");
            if (ddApiKey == null) {
                ddApiKey = "your-api-key-here";
            }

            DatadogLambda datadog = new DatadogLambda(this, "Datadog",
                    DatadogLambdaProps.builder()
                            .nodeLayerVersion(113)
                            .pythonLayerVersion(97)
                            .javaLayerVersion(21)
                            .dotnetLayerVersion(15)
                            .addLayers(true)
                            .extensionLayerVersion(62)
                            .flushMetricsToLogs(true)
                            .site("datadoghq.com")
                            .apiKey(ddApiKey)
                            .enableDatadogTracing(true)
                            .enableMergeXrayTraces(true)
                            .enableDatadogLogs(true)
                            .injectLogContext(true)
                            .logLevel("debug")
                            .build()
            );

            datadog.addLambdaFunctions(new Object[]{myFunction});
        }
    }
}
