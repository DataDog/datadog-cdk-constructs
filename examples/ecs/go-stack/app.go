package main

import (
	"os"

	"github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsecs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type AppStackProps struct {
	awscdk.StackProps
}

// Creates a stack with Datadog instrumentation for ECS Fargate
func NewAppStackWithDatadogFargate(scope constructs.Construct, id string, props *AppStackProps) awscdk.Stack {
	// Setup stack
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// Set up Datadog integration
	datadog := ddcdkconstruct.NewDatadogECSFargate(
		&ddcdkconstruct.DatadogECSFargateProps{
			ApiKey: jsii.String(os.Getenv("DD_API_KEY")),
		},
	)
	task := datadog.FargateTaskDefinition(
		stack,
		jsii.String("DatadogGolangTask"),
		&awsecs.FargateTaskDefinitionProps{},
		&ddcdkconstruct.DatadogECSFargateProps{},
	)
	task.AddContainer(
		jsii.String("DummyDogstatsd"),
		&awsecs.ContainerDefinitionOptions{
			Image: awsecs.ContainerImage_FromRegistry(
				jsii.String("ghcr.io/datadog/apps-dogstatsd:main"),
				&awsecs.RepositoryImageProps{},
			),
		},
	)

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewAppStackWithDatadogFargate(app, "CdkGoStack", &AppStackProps{
		awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

// env determines the AWS environment (account+region) in which our stack is to
// be deployed. For more information see: https://docs.aws.amazon.com/cdk/latest/guide/environments.html
func env() *awscdk.Environment {
	env := awscdk.Environment{
		Account: jsii.String("376334461865"),
		Region:  jsii.String("us-east-1"),
	}
	return &env
}
