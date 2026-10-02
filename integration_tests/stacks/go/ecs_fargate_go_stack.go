package main

import (
	"github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v5"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsecs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// Creates a stack with automatic APM instrumentation for an ECS Fargate task
func NewEcsFargateGoStack(scope constructs.Construct, id string, props *AppStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	datadog := ddcdkconstruct.NewDatadogECSFargate(&ddcdkconstruct.DatadogECSFargateProps{
		ApiKey: jsii.String("exampleApiKey"),
		Env:    jsii.String("prod"),
	})

	task := datadog.FargateTaskDefinition(
		stack,
		jsii.String("apmInstrumentationTaskDefinition"),
		&awsecs.FargateTaskDefinitionProps{
			MemoryLimitMiB: jsii.Number(512),
			Cpu:            jsii.Number(256),
		},
		&ddcdkconstruct.DatadogECSFargateProps{
			ApmInstrumentation: &ddcdkconstruct.APMInstrumentationConfig{
				Language: ddcdkconstruct.TracerLanguage_JAVA,
			},
		},
	)
	task.AddContainer(jsii.String("javaApp"), &awsecs.ContainerDefinitionOptions{
		Image: awsecs.ContainerImage_FromRegistry(jsii.String("ecs-sample-image/java-app"), nil),
		// the tracer is appended to this value
		Environment: &map[string]*string{
			"JAVA_TOOL_OPTIONS": jsii.String("-Xmx256m"),
		},
	})

	return stack
}
