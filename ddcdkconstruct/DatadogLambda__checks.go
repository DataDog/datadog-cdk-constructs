//go:build !no_runtime_type_checking

package ddcdkconstruct

import (
	"fmt"

	_jsii_ "github.com/aws/jsii-runtime-go/runtime"

	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/constructs-go/constructs/v10"
)

func (d *jsiiProxy_DatadogLambda) validateAddForwarderToNonLambdaLogGroupsParameters(logGroups *[]awslogs.ILogGroup) error {
	if logGroups == nil {
		return fmt.Errorf("parameter logGroups is required, but nil was provided")
	}

	return nil
}

func (d *jsiiProxy_DatadogLambda) validateAddGitCommitMetadataParameters(lambdaFunctions *[]interface{}) error {
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

func (d *jsiiProxy_DatadogLambda) validateAddLambdaFunctionsParameters(lambdaFunctions *[]interface{}) error {
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

func (d *jsiiProxy_DatadogLambda) validateOverrideGitMetadataParameters(gitCommitSha *string) error {
	if gitCommitSha == nil {
		return fmt.Errorf("parameter gitCommitSha is required, but nil was provided")
	}

	return nil
}

func validateDatadogLambda_IsConstructParameters(x interface{}) error {
	if x == nil {
		return fmt.Errorf("parameter x is required, but nil was provided")
	}

	return nil
}

func (j *jsiiProxy_DatadogLambda) validateSetContextGitShaOverrideKeyParameters(val *string) error {
	if val == nil {
		return fmt.Errorf("parameter val is required, but nil was provided")
	}

	return nil
}

func (j *jsiiProxy_DatadogLambda) validateSetLambdasParameters(val *[]interface{}) error {
	if val == nil {
		return fmt.Errorf("parameter val is required, but nil was provided")
	}
	for idx_97dfc6, v := range *val {
		switch v.(type) {
		case awslambda.Function:
			// ok
		case awslambda.SingletonFunction:
			// ok
		default:
			if !_jsii_.IsAnonymousProxy(v) {
				return fmt.Errorf("parameter val[%#v] must be one of the allowed types: awslambda.Function, awslambda.SingletonFunction; received %#v (a %T)", idx_97dfc6, v, v)
			}
		}
	}

	return nil
}

func (j *jsiiProxy_DatadogLambda) validateSetPropsParameters(val *DatadogLambdaProps) error {
	if val == nil {
		return fmt.Errorf("parameter val is required, but nil was provided")
	}
	if err := _jsii_.ValidateStruct(val, func() string { return "parameter val" }); err != nil {
		return err
	}

	return nil
}

func (j *jsiiProxy_DatadogLambda) validateSetScopeParameters(val constructs.Construct) error {
	if val == nil {
		return fmt.Errorf("parameter val is required, but nil was provided")
	}

	return nil
}

func (j *jsiiProxy_DatadogLambda) validateSetTransportParameters(val Transport) error {
	if val == nil {
		return fmt.Errorf("parameter val is required, but nil was provided")
	}

	return nil
}

func validateNewDatadogLambdaParameters(scope constructs.Construct, id *string, props *DatadogLambdaProps) error {
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

