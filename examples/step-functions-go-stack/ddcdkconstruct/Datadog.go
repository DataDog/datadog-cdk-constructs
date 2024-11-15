package ddcdkconstruct

import (
	_jsii_ "github.com/aws/jsii-runtime-go/runtime"
	_init_ "github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/jsii"

	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/constructs-go/constructs/v10"
)

// For backward compatibility.
//
// It's recommended to use DatadogLambda for
// users who want to add Datadog monitoring for Lambda functions.
type Datadog interface {
	DatadogLambda
	// The tree node.
	Node() constructs.Node
	Props() *DatadogLambdaProps
	SetProps(val *DatadogLambdaProps)
	Scope() constructs.Construct
	SetScope(val constructs.Construct)
	Transport() Transport
	SetTransport(val Transport)
	AddForwarderToNonLambdaLogGroups(logGroups *[]awslogs.ILogGroup)
	AddGitCommitMetadata(lambdaFunctions *[]interface{}, gitCommitSha *string, gitRepoUrl *string)
	AddLambdaFunctions(lambdaFunctions *[]interface{}, construct constructs.Construct)
	// Returns a string representation of this construct.
	ToString() *string
}

// The jsii proxy struct for Datadog
type jsiiProxy_Datadog struct {
	jsiiProxy_DatadogLambda
}

func (j *jsiiProxy_Datadog) Node() constructs.Node {
	var returns constructs.Node
	_jsii_.Get(
		j,
		"node",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_Datadog) Props() *DatadogLambdaProps {
	var returns *DatadogLambdaProps
	_jsii_.Get(
		j,
		"props",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_Datadog) Scope() constructs.Construct {
	var returns constructs.Construct
	_jsii_.Get(
		j,
		"scope",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_Datadog) Transport() Transport {
	var returns Transport
	_jsii_.Get(
		j,
		"transport",
		&returns,
	)
	return returns
}


func NewDatadog(scope constructs.Construct, id *string, props *DatadogProps) Datadog {
	_init_.Initialize()

	if err := validateNewDatadogParameters(scope, id, props); err != nil {
		panic(err)
	}
	j := jsiiProxy_Datadog{}

	_jsii_.Create(
		"datadog-cdk-constructs-v2.Datadog",
		[]interface{}{scope, id, props},
		&j,
	)

	return &j
}

func NewDatadog_Override(d Datadog, scope constructs.Construct, id *string, props *DatadogProps) {
	_init_.Initialize()

	_jsii_.Create(
		"datadog-cdk-constructs-v2.Datadog",
		[]interface{}{scope, id, props},
		d,
	)
}

func (j *jsiiProxy_Datadog)SetProps(val *DatadogLambdaProps) {
	if err := j.validateSetPropsParameters(val); err != nil {
		panic(err)
	}
	_jsii_.Set(
		j,
		"props",
		val,
	)
}

func (j *jsiiProxy_Datadog)SetScope(val constructs.Construct) {
	if err := j.validateSetScopeParameters(val); err != nil {
		panic(err)
	}
	_jsii_.Set(
		j,
		"scope",
		val,
	)
}

func (j *jsiiProxy_Datadog)SetTransport(val Transport) {
	if err := j.validateSetTransportParameters(val); err != nil {
		panic(err)
	}
	_jsii_.Set(
		j,
		"transport",
		val,
	)
}

// Checks if `x` is a construct.
//
// Returns: true if `x` is an object created from a class which extends `Construct`.
// Deprecated: use `x instanceof Construct` instead.
func Datadog_IsConstruct(x interface{}) *bool {
	_init_.Initialize()

	if err := validateDatadog_IsConstructParameters(x); err != nil {
		panic(err)
	}
	var returns *bool

	_jsii_.StaticInvoke(
		"datadog-cdk-constructs-v2.Datadog",
		"isConstruct",
		[]interface{}{x},
		&returns,
	)

	return returns
}

func (d *jsiiProxy_Datadog) AddForwarderToNonLambdaLogGroups(logGroups *[]awslogs.ILogGroup) {
	if err := d.validateAddForwarderToNonLambdaLogGroupsParameters(logGroups); err != nil {
		panic(err)
	}
	_jsii_.InvokeVoid(
		d,
		"addForwarderToNonLambdaLogGroups",
		[]interface{}{logGroups},
	)
}

func (d *jsiiProxy_Datadog) AddGitCommitMetadata(lambdaFunctions *[]interface{}, gitCommitSha *string, gitRepoUrl *string) {
	if err := d.validateAddGitCommitMetadataParameters(lambdaFunctions); err != nil {
		panic(err)
	}
	_jsii_.InvokeVoid(
		d,
		"addGitCommitMetadata",
		[]interface{}{lambdaFunctions, gitCommitSha, gitRepoUrl},
	)
}

func (d *jsiiProxy_Datadog) AddLambdaFunctions(lambdaFunctions *[]interface{}, construct constructs.Construct) {
	if err := d.validateAddLambdaFunctionsParameters(lambdaFunctions); err != nil {
		panic(err)
	}
	_jsii_.InvokeVoid(
		d,
		"addLambdaFunctions",
		[]interface{}{lambdaFunctions, construct},
	)
}

func (d *jsiiProxy_Datadog) ToString() *string {
	var returns *string

	_jsii_.Invoke(
		d,
		"toString",
		nil, // no parameters
		&returns,
	)

	return returns
}

