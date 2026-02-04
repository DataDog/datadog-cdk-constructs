package main

import (
	"github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// Creates a stack with Datadog integration using the new API (DatadogLambda, DatadogLambdaProps)
func NewAppStackWithDatadogLambda(scope constructs.Construct, id string, props *AppStackProps) awscdk.Stack {
	stack, lambdaFunction := NewAppStackWithoutDatadog(scope, &id, props)

	// Set up Datadog integration
	datadog := ddcdkconstruct.NewDatadogLambda(
		stack,
		jsii.String("Datadog"),
		&ddcdkconstruct.DatadogLambdaProps{
			NodeLayerVersion:      jsii.Number(113),
			PythonLayerVersion:    jsii.Number(97),
			JavaLayerVersion:      jsii.Number(21),
			DotnetLayerVersion:    jsii.Number(23),
			AddLayers:             jsii.Bool(true),
			ExtensionLayerVersion: jsii.Number(62),
			FlushMetricsToLogs:    jsii.Bool(true),
			Site:                  jsii.String("datadoghq.com"),
			ApiKey:                jsii.String("1234"),
			EnableDatadogTracing:  jsii.Bool(true),
			EnableMergeXrayTraces: jsii.Bool(true),
			EnableDatadogLogs:     jsii.Bool(true),
			InjectLogContext:      jsii.Bool(true),
			LogLevel:              jsii.String("debug"),
		})

	datadog.AddLambdaFunctions(&[]interface{}{lambdaFunction}, nil)
	return stack
}

