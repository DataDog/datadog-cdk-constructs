package main

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	// Creates a stack using the new API (DatadogLambda, DatadogLambdaProps)
	NewAppStackWithDatadogLambda(app, "LambdaGoStack", &AppStackProps{
		StackProps: awscdk.StackProps{
			Env: env(),
		},
	})

	// Creates a stack using the old API (Datadog, DatadogProps)
	NewAppStackWithDatadogOldApi(app, "LambdaGoOldLambdaApiStack", &AppStackProps{
		StackProps: awscdk.StackProps{
			Env: env(),
		},
	})

	// Creates a Step Functions stack
	NewCdkStepFunctionsGoStack(app, "StepFunctionsGoStack", &AppStackProps{
		StackProps: awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

// env determines the AWS environment (account + region)
func env() *awscdk.Environment {
	return &awscdk.Environment{
		Account: jsii.String("425362996713"),
		Region:  jsii.String("us-east-1"),
	}
}
