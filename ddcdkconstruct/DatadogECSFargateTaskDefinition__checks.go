//go:build !no_runtime_type_checking

package ddcdkconstruct

import (
	"fmt"

	_jsii_ "github.com/aws/jsii-runtime-go/runtime"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsecs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/constructs-go/constructs/v10"
)

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddContainerParameters(id *string, containerProps *awsecs.ContainerDefinitionOptions) error {
	if id == nil {
		return fmt.Errorf("parameter id is required, but nil was provided")
	}

	if containerProps == nil {
		return fmt.Errorf("parameter containerProps is required, but nil was provided")
	}
	if err := _jsii_.ValidateStruct(containerProps, func() string { return "parameter containerProps" }); err != nil {
		return err
	}

	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddExtensionParameters(extension awsecs.ITaskDefinitionExtension) error {
	if extension == nil {
		return fmt.Errorf("parameter extension is required, but nil was provided")
	}

	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddFirelensLogRouterParameters(id *string, props *awsecs.FirelensLogRouterDefinitionOptions) error {
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

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddInferenceAcceleratorParameters(inferenceAccelerator *awsecs.InferenceAccelerator) error {
	if inferenceAccelerator == nil {
		return fmt.Errorf("parameter inferenceAccelerator is required, but nil was provided")
	}
	if err := _jsii_.ValidateStruct(inferenceAccelerator, func() string { return "parameter inferenceAccelerator" }); err != nil {
		return err
	}

	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddPlacementConstraintParameters(constraint awsecs.PlacementConstraint) error {
	if constraint == nil {
		return fmt.Errorf("parameter constraint is required, but nil was provided")
	}

	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddToExecutionRolePolicyParameters(statement awsiam.PolicyStatement) error {
	if statement == nil {
		return fmt.Errorf("parameter statement is required, but nil was provided")
	}

	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddToTaskRolePolicyParameters(statement awsiam.PolicyStatement) error {
	if statement == nil {
		return fmt.Errorf("parameter statement is required, but nil was provided")
	}

	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateAddVolumeParameters(volume *awsecs.Volume) error {
	if volume == nil {
		return fmt.Errorf("parameter volume is required, but nil was provided")
	}
	if err := _jsii_.ValidateStruct(volume, func() string { return "parameter volume" }); err != nil {
		return err
	}

	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateApplyRemovalPolicyParameters(policy awscdk.RemovalPolicy) error {
	if policy == "" {
		return fmt.Errorf("parameter policy is required, but nil was provided")
	}

	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateFindContainerParameters(containerName *string) error {
	if containerName == nil {
		return fmt.Errorf("parameter containerName is required, but nil was provided")
	}

	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateFindPortMappingByNameParameters(name *string) error {
	if name == nil {
		return fmt.Errorf("parameter name is required, but nil was provided")
	}

	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateGetResourceArnAttributeParameters(arnAttr *string, arnComponents *awscdk.ArnComponents) error {
	if arnAttr == nil {
		return fmt.Errorf("parameter arnAttr is required, but nil was provided")
	}

	if arnComponents == nil {
		return fmt.Errorf("parameter arnComponents is required, but nil was provided")
	}
	if err := _jsii_.ValidateStruct(arnComponents, func() string { return "parameter arnComponents" }); err != nil {
		return err
	}

	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateGetResourceNameAttributeParameters(nameAttr *string) error {
	if nameAttr == nil {
		return fmt.Errorf("parameter nameAttr is required, but nil was provided")
	}

	return nil
}

func (d *jsiiProxy_DatadogECSFargateTaskDefinition) validateGrantRunParameters(grantee awsiam.IGrantable) error {
	if grantee == nil {
		return fmt.Errorf("parameter grantee is required, but nil was provided")
	}

	return nil
}

func validateDatadogECSFargateTaskDefinition_FromFargateTaskDefinitionArnParameters(scope constructs.Construct, id *string, fargateTaskDefinitionArn *string) error {
	if scope == nil {
		return fmt.Errorf("parameter scope is required, but nil was provided")
	}

	if id == nil {
		return fmt.Errorf("parameter id is required, but nil was provided")
	}

	if fargateTaskDefinitionArn == nil {
		return fmt.Errorf("parameter fargateTaskDefinitionArn is required, but nil was provided")
	}

	return nil
}

func validateDatadogECSFargateTaskDefinition_FromFargateTaskDefinitionAttributesParameters(scope constructs.Construct, id *string, attrs *awsecs.FargateTaskDefinitionAttributes) error {
	if scope == nil {
		return fmt.Errorf("parameter scope is required, but nil was provided")
	}

	if id == nil {
		return fmt.Errorf("parameter id is required, but nil was provided")
	}

	if attrs == nil {
		return fmt.Errorf("parameter attrs is required, but nil was provided")
	}
	if err := _jsii_.ValidateStruct(attrs, func() string { return "parameter attrs" }); err != nil {
		return err
	}

	return nil
}

func validateDatadogECSFargateTaskDefinition_FromTaskDefinitionArnParameters(scope constructs.Construct, id *string, taskDefinitionArn *string) error {
	if scope == nil {
		return fmt.Errorf("parameter scope is required, but nil was provided")
	}

	if id == nil {
		return fmt.Errorf("parameter id is required, but nil was provided")
	}

	if taskDefinitionArn == nil {
		return fmt.Errorf("parameter taskDefinitionArn is required, but nil was provided")
	}

	return nil
}

func validateDatadogECSFargateTaskDefinition_FromTaskDefinitionAttributesParameters(scope constructs.Construct, id *string, attrs *awsecs.TaskDefinitionAttributes) error {
	if scope == nil {
		return fmt.Errorf("parameter scope is required, but nil was provided")
	}

	if id == nil {
		return fmt.Errorf("parameter id is required, but nil was provided")
	}

	if attrs == nil {
		return fmt.Errorf("parameter attrs is required, but nil was provided")
	}
	if err := _jsii_.ValidateStruct(attrs, func() string { return "parameter attrs" }); err != nil {
		return err
	}

	return nil
}

func validateDatadogECSFargateTaskDefinition_IsConstructParameters(x interface{}) error {
	if x == nil {
		return fmt.Errorf("parameter x is required, but nil was provided")
	}

	return nil
}

func validateDatadogECSFargateTaskDefinition_IsOwnedResourceParameters(construct constructs.IConstruct) error {
	if construct == nil {
		return fmt.Errorf("parameter construct is required, but nil was provided")
	}

	return nil
}

func validateDatadogECSFargateTaskDefinition_IsResourceParameters(construct constructs.IConstruct) error {
	if construct == nil {
		return fmt.Errorf("parameter construct is required, but nil was provided")
	}

	return nil
}

func validateNewDatadogECSFargateTaskDefinitionParameters(scope constructs.Construct, id *string, props *awsecs.FargateTaskDefinitionProps, datadogProps *DatadogECSFargateProps) error {
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

