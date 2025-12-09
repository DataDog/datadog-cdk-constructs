package com.datadoghq.test;

import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;

public class App {
    public static void main(final String[] args) {
        software.amazon.awscdk.App app = new software.amazon.awscdk.App();

        Environment env = Environment.builder()
                .account("601427279990")
                .region("sa-east-1")
                .build();

        LambdaJavaStack stack = new LambdaJavaStack(app, "LambdaJavaStack",
                StackProps.builder()
                        .env(env)
                        .build());

        System.out.println("Stack name: " + stack.getStackName());
        app.synth();
    }
}
