package main

import (
	"os"

	"github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct"
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	sfn "github.com/aws/aws-cdk-go/awscdk/v2/awsstepfunctions"
	sfntasks "github.com/aws/aws-cdk-go/awscdk/v2/awsstepfunctionstasks"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type AppStackProps struct {
	awscdk.StackProps
}

func NewCdkStepFunctionsGoStack(scope constructs.Construct, id *string, props *AppStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}

	stack := awscdk.NewStack(scope, id, &sprops)

	/* Set up the child state machine */

	passState := sfn.NewPass(stack, jsii.String("PassState"), nil)
	waitState := sfn.NewWait(stack, jsii.String("WaitState"), &sfn.WaitProps{
		Time: sfn.WaitTime_Duration(awscdk.Duration_Seconds(jsii.Number(1))),
	})
	successState := sfn.NewSucceed(stack, jsii.String("SuccessState"), nil)

	childStateMachine := sfn.NewStateMachine(stack, jsii.String("CdkGoTestChildStateMachine"), &sfn.StateMachineProps{
		DefinitionBody: sfn.DefinitionBody_FromChainable(passState.Next(waitState).Next(successState)),
	})

	/* Set up the parent state machine */

	stateMachineTaskInput := ddcdkconstruct.DatadogStepFunctions_BuildStepFunctionTaskInputToMergeTraces(&map[string]interface{}{
		"custom-key": "custom-value",
	})
	invokeChildStateMachineTask := sfntasks.NewStepFunctionsStartExecution(stack, jsii.String("InvokeChildStateMachineTask"), &sfntasks.StepFunctionsStartExecutionProps{
		StateMachine: childStateMachine,
		Input: sfn.TaskInput_FromObject(stateMachineTaskInput),
	})

	helloLambdaFunction := awslambda.NewFunction(stack, jsii.String("HelloWorldFunction"), &awslambda.FunctionProps{
		Runtime: awslambda.Runtime_NODEJS_20_X(),
		Timeout: awscdk.Duration_Seconds(jsii.Number(10)), 
		Handler: jsii.String("index.handler"),
		Code: awslambda.Code_FromInline(jsii.String(`
		  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
		  exports.handler = async function(event) {
			await sleep(500); // sleep for 0.5 second
			return {
			  statusCode: 200,
			  body: JSON.stringify('Hello World!'),
			};
		  };
		`)),
	})

	lambdaPayload := ddcdkconstruct.DatadogStepFunctions_BuildLambdaPayloadToMergeTraces(&map[string]interface{}{
		"custom-key": "custom-value",
	})
	lambdaTask := sfntasks.NewLambdaInvoke(stack, jsii.String("MyLambdaTask"), &sfntasks.LambdaInvokeProps{
		LambdaFunction: helloLambdaFunction,
		Payload: sfn.TaskInput_FromObject(lambdaPayload),
	})

	parentStateMachine := sfn.NewStateMachine(stack, jsii.String("CdkGoTestStateMachine"), &sfn.StateMachineProps{
		DefinitionBody: sfn.DefinitionBody_FromChainable(lambdaTask.Next(invokeChildStateMachineTask)),
	})

	/* Instrument the lambda functions and the state machines */
	
	datadogSfn := ddcdkconstruct.NewDatadogStepFunctions(stack, jsii.String("DatadogSfn"), &ddcdkconstruct.DatadogStepFunctionsProps{
		Env:            jsii.String("dev"),
		Service:        jsii.String("cdk-test-service"),
		Version:        jsii.String("1.0.0"),
		ForwarderArn:   jsii.String(os.Getenv("DD_FORWARDER_ARN")),
		Tags:           jsii.String("custom-tag-1:tag-value-1,custom-tag-2:tag-value-2"),
	})
	datadogSfn.AddStateMachines(&[]sfn.StateMachine{childStateMachine, parentStateMachine}, nil)

	datadogLambda := ddcdkconstruct.NewDatadogLambda(stack, jsii.String("DatadogLambda"), &ddcdkconstruct.DatadogLambdaProps{
		NodeLayerVersion:      jsii.Number(113),
		ExtensionLayerVersion: jsii.Number(65),
		AddLayers:            jsii.Bool(true),
		ApiKey:               jsii.String(os.Getenv("DD_API_KEY")),
		EnableDatadogTracing: jsii.Bool(true),
		EnableDatadogASM:     jsii.Bool(true),
		FlushMetricsToLogs:   jsii.Bool(true),
		Site:                 jsii.String("datadoghq.com"),
		Env:                  jsii.String("dev"),
		Service:              jsii.String("cdk-test-service"),
		Version:              jsii.String("1.0.0"),
	})
	datadogLambda.AddLambdaFunctions(&[]interface{}{helloLambdaFunction}, nil)

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewCdkStepFunctionsGoStack(app, jsii.String("CdkStepFunctionsGoStack"), &AppStackProps{
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
