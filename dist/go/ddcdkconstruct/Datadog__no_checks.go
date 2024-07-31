//go:build no_runtime_type_checking

package ddcdkconstruct

// Building without runtime type checking enabled, so all the below just return nil

func (d *jsiiProxy_Datadog) validateAddForwarderToNonLambdaLogGroupsParameters(logGroups *[]awslogs.ILogGroup) error {
	return nil
}

func (d *jsiiProxy_Datadog) validateAddGitCommitMetadataParameters(lambdaFunctions *[]interface{}) error {
	return nil
}

func (d *jsiiProxy_Datadog) validateAddLambdaFunctionsParameters(lambdaFunctions *[]interface{}) error {
	return nil
}

func validateDatadog_IsConstructParameters(x interface{}) error {
	return nil
}

func (j *jsiiProxy_Datadog) validateSetPropsParameters(val *DatadogProps) error {
	return nil
}

func (j *jsiiProxy_Datadog) validateSetScopeParameters(val constructs.Construct) error {
	return nil
}

func (j *jsiiProxy_Datadog) validateSetTransportParameters(val Transport) error {
	return nil
}

func validateNewDatadogParameters(scope constructs.Construct, id *string, props *DatadogProps) error {
	return nil
}

