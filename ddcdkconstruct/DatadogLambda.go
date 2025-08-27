package ddcdkconstruct

import (
	_jsii_ "github.com/aws/jsii-runtime-go/runtime"
	_init_ "github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v3/jsii"

	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v3/internal"
)

type DatadogLambda interface {
	constructs.Construct
	ContextGitShaOverrideKey() *string
	SetContextGitShaOverrideKey(val *string)
	GitCommitShaOverride() *string
	SetGitCommitShaOverride(val *string)
	GitRepoUrlOverride() *string
	SetGitRepoUrlOverride(val *string)
	Lambdas() *[]interface{}
	SetLambdas(val *[]interface{})
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
	OverrideGitMetadata(gitCommitSha *string, gitRepoUrl *string)
	// Returns a string representation of this construct.
	ToString() *string
}

// The jsii proxy struct for DatadogLambda
type jsiiProxy_DatadogLambda struct {
	internal.Type__constructsConstruct
}

func (j *jsiiProxy_DatadogLambda) ContextGitShaOverrideKey() *string {
	var returns *string
	_jsii_.Get(
		j,
		"contextGitShaOverrideKey",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_DatadogLambda) GitCommitShaOverride() *string {
	var returns *string
	_jsii_.Get(
		j,
		"gitCommitShaOverride",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_DatadogLambda) GitRepoUrlOverride() *string {
	var returns *string
	_jsii_.Get(
		j,
		"gitRepoUrlOverride",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_DatadogLambda) Lambdas() *[]interface{} {
	var returns *[]interface{}
	_jsii_.Get(
		j,
		"lambdas",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_DatadogLambda) Node() constructs.Node {
	var returns constructs.Node
	_jsii_.Get(
		j,
		"node",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_DatadogLambda) Props() *DatadogLambdaProps {
	var returns *DatadogLambdaProps
	_jsii_.Get(
		j,
		"props",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_DatadogLambda) Scope() constructs.Construct {
	var returns constructs.Construct
	_jsii_.Get(
		j,
		"scope",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_DatadogLambda) Transport() Transport {
	var returns Transport
	_jsii_.Get(
		j,
		"transport",
		&returns,
	)
	return returns
}


func NewDatadogLambda(scope constructs.Construct, id *string, props *DatadogLambdaProps) DatadogLambda {
	_init_.Initialize()

	if err := validateNewDatadogLambdaParameters(scope, id, props); err != nil {
		panic(err)
	}
	j := jsiiProxy_DatadogLambda{}

	_jsii_.Create(
		"datadog-cdk-constructs-v2.DatadogLambda",
		[]interface{}{scope, id, props},
		&j,
	)

	return &j
}

func NewDatadogLambda_Override(d DatadogLambda, scope constructs.Construct, id *string, props *DatadogLambdaProps) {
	_init_.Initialize()

	_jsii_.Create(
		"datadog-cdk-constructs-v2.DatadogLambda",
		[]interface{}{scope, id, props},
		d,
	)
}

func (j *jsiiProxy_DatadogLambda)SetContextGitShaOverrideKey(val *string) {
	if err := j.validateSetContextGitShaOverrideKeyParameters(val); err != nil {
		panic(err)
	}
	_jsii_.Set(
		j,
		"contextGitShaOverrideKey",
		val,
	)
}

func (j *jsiiProxy_DatadogLambda)SetGitCommitShaOverride(val *string) {
	_jsii_.Set(
		j,
		"gitCommitShaOverride",
		val,
	)
}

func (j *jsiiProxy_DatadogLambda)SetGitRepoUrlOverride(val *string) {
	_jsii_.Set(
		j,
		"gitRepoUrlOverride",
		val,
	)
}

func (j *jsiiProxy_DatadogLambda)SetLambdas(val *[]interface{}) {
	if err := j.validateSetLambdasParameters(val); err != nil {
		panic(err)
	}
	_jsii_.Set(
		j,
		"lambdas",
		val,
	)
}

func (j *jsiiProxy_DatadogLambda)SetProps(val *DatadogLambdaProps) {
	if err := j.validateSetPropsParameters(val); err != nil {
		panic(err)
	}
	_jsii_.Set(
		j,
		"props",
		val,
	)
}

func (j *jsiiProxy_DatadogLambda)SetScope(val constructs.Construct) {
	if err := j.validateSetScopeParameters(val); err != nil {
		panic(err)
	}
	_jsii_.Set(
		j,
		"scope",
		val,
	)
}

func (j *jsiiProxy_DatadogLambda)SetTransport(val Transport) {
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
func DatadogLambda_IsConstruct(x interface{}) *bool {
	_init_.Initialize()

	if err := validateDatadogLambda_IsConstructParameters(x); err != nil {
		panic(err)
	}
	var returns *bool

	_jsii_.StaticInvoke(
		"datadog-cdk-constructs-v2.DatadogLambda",
		"isConstruct",
		[]interface{}{x},
		&returns,
	)

	return returns
}

func (d *jsiiProxy_DatadogLambda) AddForwarderToNonLambdaLogGroups(logGroups *[]awslogs.ILogGroup) {
	if err := d.validateAddForwarderToNonLambdaLogGroupsParameters(logGroups); err != nil {
		panic(err)
	}
	_jsii_.InvokeVoid(
		d,
		"addForwarderToNonLambdaLogGroups",
		[]interface{}{logGroups},
	)
}

func (d *jsiiProxy_DatadogLambda) AddGitCommitMetadata(lambdaFunctions *[]interface{}, gitCommitSha *string, gitRepoUrl *string) {
	if err := d.validateAddGitCommitMetadataParameters(lambdaFunctions); err != nil {
		panic(err)
	}
	_jsii_.InvokeVoid(
		d,
		"addGitCommitMetadata",
		[]interface{}{lambdaFunctions, gitCommitSha, gitRepoUrl},
	)
}

func (d *jsiiProxy_DatadogLambda) AddLambdaFunctions(lambdaFunctions *[]interface{}, construct constructs.Construct) {
	if err := d.validateAddLambdaFunctionsParameters(lambdaFunctions); err != nil {
		panic(err)
	}
	_jsii_.InvokeVoid(
		d,
		"addLambdaFunctions",
		[]interface{}{lambdaFunctions, construct},
	)
}

func (d *jsiiProxy_DatadogLambda) OverrideGitMetadata(gitCommitSha *string, gitRepoUrl *string) {
	if err := d.validateOverrideGitMetadataParameters(gitCommitSha); err != nil {
		panic(err)
	}
	_jsii_.InvokeVoid(
		d,
		"overrideGitMetadata",
		[]interface{}{gitCommitSha, gitRepoUrl},
	)
}

func (d *jsiiProxy_DatadogLambda) ToString() *string {
	var returns *string

	_jsii_.Invoke(
		d,
		"toString",
		nil, // no parameters
		&returns,
	)

	return returns
}

