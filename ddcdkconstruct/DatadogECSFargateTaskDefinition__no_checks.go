//go:build no_runtime_type_checking

package ddcdkconstruct

// Building without runtime type checking enabled, so all the below just return nil

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddContainerParameters(id *string, containerProps *awsecs.ContainerDefinitionOptions) error {
	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddExtensionParameters(extension awsecs.ITaskDefinitionExtension) error {
	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddFirelensLogRouterParameters(id *string, props *awsecs.FirelensLogRouterDefinitionOptions) error {
	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddInferenceAcceleratorParameters(inferenceAccelerator *awsecs.InferenceAccelerator) error {
	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddPlacementConstraintParameters(constraint awsecs.PlacementConstraint) error {
	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddToExecutionRolePolicyParameters(statement awsiam.PolicyStatement) error {
	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddToTaskRolePolicyParameters(statement awsiam.PolicyStatement) error {
	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddVolumeParameters(volume *awsecs.Volume) error {
	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateApplyRemovalPolicyParameters(policy awscdk.RemovalPolicy) error {
	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateFindContainerParameters(containerName *string) error {
	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateFindPortMappingByNameParameters(name *string) error {
	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateGetResourceArnAttributeParameters(arnAttr *string, arnComponents *awscdk.ArnComponents) error {
	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateGetResourceNameAttributeParameters(nameAttr *string) error {
	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateGrantRunParameters(grantee awsiam.IGrantable) error {
	return nil
}

func validateDatadogECSFargateTaskDefinition_FromFargateTaskDefinitionArnParameters(scope constructs.Construct, id *string, fargateTaskDefinitionArn *string) error {
	return nil
}

func validateDatadogECSFargateTaskDefinition_FromFargateTaskDefinitionAttributesParameters(scope constructs.Construct, id *string, attrs *awsecs.FargateTaskDefinitionAttributes) error {
	return nil
}

func validateDatadogECSFargateTaskDefinition_FromTaskDefinitionArnParameters(scope constructs.Construct, id *string, taskDefinitionArn *string) error {
	return nil
}

func validateDatadogECSFargateTaskDefinition_FromTaskDefinitionAttributesParameters(scope constructs.Construct, id *string, attrs *awsecs.TaskDefinitionAttributes) error {
	return nil
}

func validateDatadogECSFargateTaskDefinition_IsConstructParameters(x interface{}) error {
	return nil
}

func validateDatadogECSFargateTaskDefinition_IsOwnedResourceParameters(construct constructs.IConstruct) error {
	return nil
}

func validateDatadogECSFargateTaskDefinition_IsResourceParameters(construct constructs.IConstruct) error {
	return nil
}

func validateNewDatadogECSFargateTaskDefinitionParameters(scope constructs.Construct, id *string, props *awsecs.FargateTaskDefinitionProps, datadogProps *DatadogECSFargateProps) error {
	return nil
}

