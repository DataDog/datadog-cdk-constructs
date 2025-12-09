package com.datadoghq.test;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.lambda.Code;
import software.amazon.awscdk.services.lambda.Function;
import software.amazon.awscdk.services.lambda.Runtime;
import software.constructs.Construct;
import com.datadoghq.cdkconstructs.DatadogLambda;
import com.datadoghq.cdkconstructs.DatadogLambdaProps;

import java.util.Arrays;

public class LambdaJavaStack extends Stack {
    public LambdaJavaStack(final Construct scope, final String id) {
        this(scope, id, null);
    }

    public LambdaJavaStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create a simple Lambda function
        Function lambdaFunction = Function.Builder.create(this, "HelloHandler")
                .runtime(Runtime.NODEJS_20_X)
                .code(Code.fromAsset("../../lambda"))
                .handler("hello.handler")
                .build();

        // Set up Datadog integration
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
                        .apiKey("1234")
                        .enableDatadogTracing(true)
                        .enableMergeXrayTraces(true)
                        .enableDatadogLogs(true)
                        .injectLogContext(true)
                        .logLevel("debug")
                        .build()
        );

        datadog.addLambdaFunctions(Arrays.asList(lambdaFunction));
    }
}
