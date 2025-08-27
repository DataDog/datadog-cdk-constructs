//go:build !no_runtime_type_checking

package ddcdkconstruct

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
)

func (t *jsiiProxy_Transport) validateApplyEnvVarsParameters(lam awslambda.Function) error {
	if lam == nil {
		return fmt.Errorf("parameter lam is required, but nil was provided")
	}

	return nil
}

func (j *jsiiProxy_Transport) validateSetFlushMetricsToLogsParameters(val *bool) error {
	if val == nil {
		return fmt.Errorf("parameter val is required, but nil was provided")
	}

	return nil
}

func (j *jsiiProxy_Transport) validateSetSiteParameters(val *string) error {
	if val == nil {
		return fmt.Errorf("parameter val is required, but nil was provided")
	}

	return nil
}

