//go:build no_runtime_type_checking

package ddcdkconstruct

// Building without runtime type checking enabled, so all the below just return nil

func (d *jsiiProxy_DatadogLambda) validateAddForwarderToNonLambdaLogGroupsParameters(logGroups *[]awslogs.ILogGroup) error {
	return nil
}

func (d *jsiiProxy_DatadogLambda) validateAddGitCommitMetadataParameters(lambdaFunctions *[]interface{}) error {
	return nil
}

func (d *jsiiProxy_DatadogLambda) validateAddLambdaFunctionsParameters(lambdaFunctions *[]interface{}) error {
	return nil
}

func validateDatadogLambda_IsConstructParameters(x interface{}) error {
	return nil
}

func (j *jsiiProxy_DatadogLambda) validateSetPropsParameters(val *DatadogLambdaProps) error {
	return nil
}

func (j *jsiiProxy_DatadogLambda) validateSetScopeParameters(val constructs.Construct) error {
	return nil
}

func (j *jsiiProxy_DatadogLambda) validateSetTransportParameters(val Transport) error {
	return nil
}

func validateNewDatadogLambdaParameters(scope constructs.Construct, id *string, props *DatadogLambdaProps) error {
	return nil
}

