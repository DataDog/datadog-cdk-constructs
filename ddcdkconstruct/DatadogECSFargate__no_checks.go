//go:build no_runtime_type_checking

package ddcdkconstruct

// Building without runtime type checking enabled, so all the below just return nil

func (d *jsiiProxy_DatadogECSFargate) validateFargateTaskDefinitionParameters(scope constructs.Construct, id *string, props *awsecs.FargateTaskDefinitionProps, datadogProps *DatadogECSFargateProps) error {
	return nil
}

func validateNewDatadogECSFargateParameters(datadogProps *DatadogECSFargateProps) error {
	return nil
}

