package main

import (
	"os"

	"github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type AppStackProps struct {
	awscdk.StackProps
}

// Creates a stack without Datadog integration
func NewAppStackWithoutDatadog(scope constructs.Construct, id *string, props *AppStackProps) (awscdk.Stack, awslambda.Function) {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	myFunction := awslambda.NewFunction(stack, jsii.String("HelloWorldFunction"), &awslambda.FunctionProps{
		Runtime: awslambda.Runtime_NODEJS_20_X(),
		Handler: jsii.String("index.handler"),
		Code: awslambda.Code_FromInline(jsii.String(`
		  exports.handler = async function(event) {
			return {
			  statusCode: 200,
			  body: JSON.stringify('Hello World!'),
			};
		  };
		`)),
	})

	// Define the Lambda function URL resource
	myFunctionUrl := myFunction.AddFunctionUrl(&awslambda.FunctionUrlOptions{
		AuthType: awslambda.FunctionUrlAuthType_NONE,
	})

	// Define a CloudFormation output for your URL
	awscdk.NewCfnOutput(stack, jsii.String("myFunctionUrlOutput"), &awscdk.CfnOutputProps{
		Value: myFunctionUrl.Url(),
	})

	return stack, myFunction
}

// Creates a stack with Datadog integration set up, using the new API (DatadogLambda, DatadogLambdaProps)
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
			ApiKey:                jsii.String(os.Getenv("DD_API_KEY")),
			EnableDatadogTracing:  jsii.Bool(true),
			EnableMergeXrayTraces: jsii.Bool(true),
			EnableDatadogLogs:     jsii.Bool(true),
			InjectLogContext:      jsii.Bool(true),
			LogLevel:              jsii.String("debug"),
		})
	datadog.AddLambdaFunctions(&[]interface{}{lambdaFunction}, nil)

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewAppStackWithDatadogLambda(app, "CdkGoStack", &AppStackProps{
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
		Account: jsii.String("425362996713"),
		Region:  jsii.String("sa-east-1"),
	}
	return &env
}
