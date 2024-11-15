//go:build no_runtime_type_checking

package ddcdkconstruct

// Building without runtime type checking enabled, so all the below just return nil

func (d *jsiiProxy_DatadogStepFunctions) validateAddStateMachinesParameters(stateMachines *[]awsstepfunctions.StateMachine) error {
	return nil
}

func validateDatadogStepFunctions_IsConstructParameters(x interface{}) error {
	return nil
}

func (j *jsiiProxy_DatadogStepFunctions) validateSetPropsParameters(val *DatadogStepFunctionsProps) error {
	return nil
}

func (j *jsiiProxy_DatadogStepFunctions) validateSetScopeParameters(val constructs.Construct) error {
	return nil
}

func (j *jsiiProxy_DatadogStepFunctions) validateSetStackParameters(val awscdk.Stack) error {
	return nil
}

func validateNewDatadogStepFunctionsParameters(scope constructs.Construct, id *string, props *DatadogStepFunctionsProps) error {
	return nil
}

