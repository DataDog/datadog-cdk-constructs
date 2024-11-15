package ddcdkconstruct

import (
	_jsii_ "github.com/aws/jsii-runtime-go/runtime"
	_init_ "github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/jsii"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsstepfunctions"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/internal"
)

type DatadogStepFunctions interface {
	constructs.Construct
	// The tree node.
	Node() constructs.Node
	Props() *DatadogStepFunctionsProps
	SetProps(val *DatadogStepFunctionsProps)
	Scope() constructs.Construct
	SetScope(val constructs.Construct)
	Stack() awscdk.Stack
	SetStack(val awscdk.Stack)
	AddStateMachines(stateMachines *[]awsstepfunctions.StateMachine, construct constructs.Construct)
	// Returns a string representation of this construct.
	ToString() *string
}

// The jsii proxy struct for DatadogStepFunctions
type jsiiProxy_DatadogStepFunctions struct {
	internal.Type__constructsConstruct
}

func (j *jsiiProxy_DatadogStepFunctions) Node() constructs.Node {
	var returns constructs.Node
	_jsii_.Get(
		j,
		"node",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_DatadogStepFunctions) Props() *DatadogStepFunctionsProps {
	var returns *DatadogStepFunctionsProps
	_jsii_.Get(
		j,
		"props",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_DatadogStepFunctions) Scope() constructs.Construct {
	var returns constructs.Construct
	_jsii_.Get(
		j,
		"scope",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_DatadogStepFunctions) Stack() awscdk.Stack {
	var returns awscdk.Stack
	_jsii_.Get(
		j,
		"stack",
		&returns,
	)
	return returns
}


func NewDatadogStepFunctions(scope constructs.Construct, id *string, props *DatadogStepFunctionsProps) DatadogStepFunctions {
	_init_.Initialize()

	if err := validateNewDatadogStepFunctionsParameters(scope, id, props); err != nil {
		panic(err)
	}
	j := jsiiProxy_DatadogStepFunctions{}

	_jsii_.Create(
		"datadog-cdk-constructs-v2.DatadogStepFunctions",
		[]interface{}{scope, id, props},
		&j,
	)

	return &j
}

func NewDatadogStepFunctions_Override(d DatadogStepFunctions, scope constructs.Construct, id *string, props *DatadogStepFunctionsProps) {
	_init_.Initialize()

	_jsii_.Create(
		"datadog-cdk-constructs-v2.DatadogStepFunctions",
		[]interface{}{scope, id, props},
		d,
	)
}

func (j *jsiiProxy_DatadogStepFunctions)SetProps(val *DatadogStepFunctionsProps) {
	if err := j.validateSetPropsParameters(val); err != nil {
		panic(err)
	}
	_jsii_.Set(
		j,
		"props",
		val,
	)
}

func (j *jsiiProxy_DatadogStepFunctions)SetScope(val constructs.Construct) {
	if err := j.validateSetScopeParameters(val); err != nil {
		panic(err)
	}
	_jsii_.Set(
		j,
		"scope",
		val,
	)
}

func (j *jsiiProxy_DatadogStepFunctions)SetStack(val awscdk.Stack) {
	if err := j.validateSetStackParameters(val); err != nil {
		panic(err)
	}
	_jsii_.Set(
		j,
		"stack",
		val,
	)
}

func DatadogStepFunctions_BuildLambdaPayloadToMergeTraces(payload *map[string]interface{}) *map[string]interface{} {
	_init_.Initialize()

	var returns *map[string]interface{}

	_jsii_.StaticInvoke(
		"datadog-cdk-constructs-v2.DatadogStepFunctions",
		"buildLambdaPayloadToMergeTraces",
		[]interface{}{payload},
		&returns,
	)

	return returns
}

func DatadogStepFunctions_BuildStepFunctionTaskInputToMergeTraces(input *map[string]interface{}) *map[string]interface{} {
	_init_.Initialize()

	var returns *map[string]interface{}

	_jsii_.StaticInvoke(
		"datadog-cdk-constructs-v2.DatadogStepFunctions",
		"buildStepFunctionTaskInputToMergeTraces",
		[]interface{}{input},
		&returns,
	)

	return returns
}

// Checks if `x` is a construct.
//
// Returns: true if `x` is an object created from a class which extends `Construct`.
// Deprecated: use `x instanceof Construct` instead.
func DatadogStepFunctions_IsConstruct(x interface{}) *bool {
	_init_.Initialize()

	if err := validateDatadogStepFunctions_IsConstructParameters(x); err != nil {
		panic(err)
	}
	var returns *bool

	_jsii_.StaticInvoke(
		"datadog-cdk-constructs-v2.DatadogStepFunctions",
		"isConstruct",
		[]interface{}{x},
		&returns,
	)

	return returns
}

func (d *jsiiProxy_DatadogStepFunctions) AddStateMachines(stateMachines *[]awsstepfunctions.StateMachine, construct constructs.Construct) {
	if err := d.validateAddStateMachinesParameters(stateMachines); err != nil {
		panic(err)
	}
	_jsii_.InvokeVoid(
		d,
		"addStateMachines",
		[]interface{}{stateMachines, construct},
	)
}

func (d *jsiiProxy_DatadogStepFunctions) ToString() *string {
	var returns *string

	_jsii_.Invoke(
		d,
		"toString",
		nil, // no parameters
		&returns,
	)

	return returns
}

