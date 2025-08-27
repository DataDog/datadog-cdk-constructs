package ddcdkconstruct

import (
	_jsii_ "github.com/aws/jsii-runtime-go/runtime"
	_init_ "github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v3/jsii"

	"github.com/aws/aws-cdk-go/awscdk/v2/awsecs"
	"github.com/aws/constructs-go/constructs/v10"
)

// The Datadog ECS Fargate construct manages the Datadog configuration for ECS Fargate tasks.
type DatadogECSFargate interface {
	// Creates a new Fargate Task Definition instrumented with Datadog.
	//
	// Merges the provided task's datadogProps with the class's datadogProps.
	FargateTaskDefinition(scope constructs.Construct, id *string, props *awsecs.FargateTaskDefinitionProps, datadogProps *DatadogECSFargateProps) DatadogECSFargateTaskDefinition
}

// The jsii proxy struct for DatadogECSFargate
type jsiiProxy_DatadogECSFargate struct {
	_ byte // padding
}

func NewDatadogECSFargate(datadogProps *DatadogECSFargateProps) DatadogECSFargate {
	_init_.Initialize()

	if err := validateNewDatadogECSFargateParameters(datadogProps); err != nil {
		panic(err)
	}
	j := jsiiProxy_DatadogECSFargate{}

	_jsii_.Create(
		"datadog-cdk-constructs-v2.DatadogECSFargate",
		[]interface{}{datadogProps},
		&j,
	)

	return &j
}

func NewDatadogECSFargate_Override(d DatadogECSFargate, datadogProps *DatadogECSFargateProps) {
	_init_.Initialize()

	_jsii_.Create(
		"datadog-cdk-constructs-v2.DatadogECSFargate",
		[]interface{}{datadogProps},
		d,
	)
}

func (d *jsiiProxy_DatadogECSFargate) FargateTaskDefinition(scope constructs.Construct, id *string, props *awsecs.FargateTaskDefinitionProps, datadogProps *DatadogECSFargateProps) DatadogECSFargateTaskDefinition {
	if err := d.validateFargateTaskDefinitionParameters(scope, id, props, datadogProps); err != nil {
		panic(err)
	}
	var returns DatadogECSFargateTaskDefinition

	_jsii_.Invoke(
		d,
		"fargateTaskDefinition",
		[]interface{}{scope, id, props, datadogProps},
		&returns,
	)

	return returns
}

