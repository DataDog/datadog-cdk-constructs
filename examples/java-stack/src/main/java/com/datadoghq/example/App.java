package com.datadoghq.example;

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

import java.util.Arrays;

public class App {
    public static void main(final String[] args) {
        software.amazon.awscdk.App app = new software.amazon.awscdk.App();

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

            // Set up Datadog integration
            // Set DD_API_KEY environment variable before running: export DD_API_KEY=your-api-key
            String ddApiKey = System.getenv("DD_API_KEY");
            if (ddApiKey == null || ddApiKey.isEmpty()) {
                throw new IllegalStateException("DD_API_KEY environment variable must be set");
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

            datadog.addLambdaFunctions(Arrays.asList(myFunction));
        }
    }
}
