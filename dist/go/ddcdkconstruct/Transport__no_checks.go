//go:build no_runtime_type_checking

package ddcdkconstruct

// Building without runtime type checking enabled, so all the below just return nil

func (t *jsiiProxy_Transport) validateApplyEnvVarsParameters(lambdas *[]awslambda.Function) error {
	return nil
}

func (j *jsiiProxy_Transport) validateSetFlushMetricsToLogsParameters(val *bool) error {
	return nil
}

func (j *jsiiProxy_Transport) validateSetSiteParameters(val *string) error {
	return nil
}

