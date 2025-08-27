//go:build !no_runtime_type_checking

package ddcdkconstruct

import (
	"fmt"

	_jsii_ "github.com/aws/jsii-runtime-go/runtime"

	"github.com/aws/aws-cdk-go/awscdk/v2/awsecs"
	"github.com/aws/constructs-go/constructs/v10"
)

func (d *jsiiProxy_DatadogECSFargate) validateFargateTaskDefinitionParameters(scope constructs.Construct, id *string, props *awsecs.FargateTaskDefinitionProps, datadogProps *DatadogECSFargateProps) error {
	if scope == nil {
		return fmt.Errorf("parameter scope is required, but nil was provided")
	}

	if id == nil {
		return fmt.Errorf("parameter id is required, but nil was provided")
	}

	if err := _jsii_.ValidateStruct(props, func() string { return "parameter props" }); err != nil {
		return err
	}

	if err := _jsii_.ValidateStruct(datadogProps, func() string { return "parameter datadogProps" }); err != nil {
		return err
	}

	return nil
}

func validateNewDatadogECSFargateParameters(datadogProps *DatadogECSFargateProps) error {
	if datadogProps == nil {
		return fmt.Errorf("parameter datadogProps is required, but nil was provided")
	}
	if err := _jsii_.ValidateStruct(datadogProps, func() string { return "parameter datadogProps" }); err != nil {
		return err
	}

	return nil
}

