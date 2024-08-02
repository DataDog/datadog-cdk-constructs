package main

import (
	"os"

	"github.com/DataDog/datadog-cdk-constructs/dist/go/ddcdkconstruct"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type AppStackProps struct {
	awscdk.StackProps
}

func NewAppStack(scope constructs.Construct, id string, props *AppStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	myFunction := awslambda.NewFunction(stack, jsii.String("HelloWorldFunction"), &awslambda.FunctionProps{
		Runtime: awslambda.Runtime_NODEJS_20_X(), // Provide any supported Node.js runtime
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

	// Set up Datadog integration
	datadog := ddcdkconstruct.NewDatadog(
		stack,
		jsii.String("Datadog"),
		&ddcdkconstruct.DatadogProps{
			NodeLayerVersion:      jsii.Number(113),
			PythonLayerVersion:    jsii.Number(97),
			JavaLayerVersion:      jsii.Number(21),
			DotnetLayerVersion:    jsii.Number(15),
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
	datadog.AddLambdaFunctions(&[]interface{}{myFunction}, nil)

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewAppStack(app, "AppStack", &AppStackProps{
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
		Region:  jsii.String("us-east-1"),
	}
	return &env
}
