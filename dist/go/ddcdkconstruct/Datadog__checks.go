//go:build !no_runtime_type_checking

package ddcdkconstruct

import (
	"fmt"

	_jsii_ "github.com/aws/jsii-runtime-go/runtime"

	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/constructs-go/constructs/v10"
)

func (d *jsiiProxy_Datadog) validateAddForwarderToNonLambdaLogGroupsParameters(logGroups *[]awslogs.ILogGroup) error {
	if logGroups == nil {
		return fmt.Errorf("parameter logGroups is required, but nil was provided")
	}

	return nil
}

func (d *jsiiProxy_Datadog) validateAddGitCommitMetadataParameters(lambdaFunctions *[]interface{}) error {
	if lambdaFunctions == nil {
		return fmt.Errorf("parameter lambdaFunctions is required, but nil was provided")
	}
	for idx_e8e072, v := range *lambdaFunctions {
		switch v.(type) {
		case awslambda.Function:
			// ok
		case awslambda.SingletonFunction:
			// ok
		default:
			if !_jsii_.IsAnonymousProxy(v) {
				return fmt.Errorf("parameter lambdaFunctions[%#v] must be one of the allowed types: awslambda.Function, awslambda.SingletonFunction; received %#v (a %T)", idx_e8e072, v, v)
			}
		}
	}

	return nil
}

func (d *jsiiProxy_Datadog) validateAddLambdaFunctionsParameters(lambdaFunctions *[]interface{}) error {
	if lambdaFunctions == nil {
		return fmt.Errorf("parameter lambdaFunctions is required, but nil was provided")
	}
	for idx_e8e072, v := range *lambdaFunctions {
		switch v.(type) {
		case awslambda.Function:
			// ok
		case awslambda.SingletonFunction:
			// ok
		default:
			if !_jsii_.IsAnonymousProxy(v) {
				return fmt.Errorf("parameter lambdaFunctions[%#v] must be one of the allowed types: awslambda.Function, awslambda.SingletonFunction; received %#v (a %T)", idx_e8e072, v, v)
			}
		}
	}

	return nil
}

func validateDatadog_IsConstructParameters(x interface{}) error {
	if x == nil {
		return fmt.Errorf("parameter x is required, but nil was provided")
	}

	return nil
}

func (j *jsiiProxy_Datadog) validateSetPropsParameters(val *DatadogProps) error {
	if val == nil {
		return fmt.Errorf("parameter val is required, but nil was provided")
	}
	if err := _jsii_.ValidateStruct(val, func() string { return "parameter val" }); err != nil {
		return err
	}

	return nil
}

func (j *jsiiProxy_Datadog) validateSetScopeParameters(val constructs.Construct) error {
	if val == nil {
		return fmt.Errorf("parameter val is required, but nil was provided")
	}

	return nil
}

func (j *jsiiProxy_Datadog) validateSetTransportParameters(val Transport) error {
	if val == nil {
		return fmt.Errorf("parameter val is required, but nil was provided")
	}

	return nil
}

func validateNewDatadogParameters(scope constructs.Construct, id *string, props *DatadogProps) error {
	if scope == nil {
		return fmt.Errorf("parameter scope is required, but nil was provided")
	}

	if id == nil {
		return fmt.Errorf("parameter id is required, but nil was provided")
	}

	if props == nil {
		return fmt.Errorf("parameter props is required, but nil was provided")
	}
	if err := _jsii_.ValidateStruct(props, func() string { return "parameter props" }); err != nil {
		return err
	}

	return nil
}

