// CDK Construct Library to automatically instrument Python and Node Lambda functions with Datadog using AWS CDK v2
package ddcdkconstruct

import (
	"reflect"

	_jsii_ "github.com/aws/jsii-runtime-go/runtime"
)

func init() {
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.APMFeatureConfig",
		reflect.TypeOf((*APMFeatureConfig)(nil)).Elem(),
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.CWSFeatureConfig",
		reflect.TypeOf((*CWSFeatureConfig)(nil)).Elem(),
	)
	_jsii_.RegisterEnum(
		"datadog-cdk-constructs-v2.Cardinality",
		reflect.TypeOf((*Cardinality)(nil)).Elem(),
		map[string]interface{}{
			"LOW": Cardinality_LOW,
			"ORCHESTRATOR": Cardinality_ORCHESTRATOR,
			"HIGH": Cardinality_HIGH,
		},
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.DatadogECSBaseProps",
		reflect.TypeOf((*DatadogECSBaseProps)(nil)).Elem(),
	)
	_jsii_.RegisterClass(
		"datadog-cdk-constructs-v2.DatadogECSFargate",
		reflect.TypeOf((*DatadogECSFargate)(nil)).Elem(),
		[]_jsii_.Member{
			_jsii_.MemberMethod{JsiiMethod: "fargateTaskDefinition", GoMethod: "FargateTaskDefinition"},
		},
		func() interface{} {
			return &jsiiProxy_DatadogECSFargate{}
		},
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.DatadogECSFargateProps",
		reflect.TypeOf((*DatadogECSFargateProps)(nil)).Elem(),
	)
	_jsii_.RegisterClass(
		"datadog-cdk-constructs-v2.DatadogECSFargateTaskDefinition",
		reflect.TypeOf((*DatadogECSFargateTaskDefinition)(nil)).Elem(),
		[]_jsii_.Member{
			_jsii_.MemberMethod{JsiiMethod: "addContainer", GoMethod: "AddContainer"},
			_jsii_.MemberMethod{JsiiMethod: "addExtension", GoMethod: "AddExtension"},
			_jsii_.MemberMethod{JsiiMethod: "addFirelensLogRouter", GoMethod: "AddFirelensLogRouter"},
			_jsii_.MemberMethod{JsiiMethod: "addInferenceAccelerator", GoMethod: "AddInferenceAccelerator"},
			_jsii_.MemberMethod{JsiiMethod: "addPlacementConstraint", GoMethod: "AddPlacementConstraint"},
			_jsii_.MemberMethod{JsiiMethod: "addToExecutionRolePolicy", GoMethod: "AddToExecutionRolePolicy"},
			_jsii_.MemberMethod{JsiiMethod: "addToTaskRolePolicy", GoMethod: "AddToTaskRolePolicy"},
			_jsii_.MemberMethod{JsiiMethod: "addVolume", GoMethod: "AddVolume"},
			_jsii_.MemberMethod{JsiiMethod: "applyRemovalPolicy", GoMethod: "ApplyRemovalPolicy"},
			_jsii_.MemberProperty{JsiiProperty: "compatibility", GoGetter: "Compatibility"},
			_jsii_.MemberProperty{JsiiProperty: "containers", GoGetter: "Containers"},
			_jsii_.MemberProperty{JsiiProperty: "cpu", GoGetter: "Cpu"},
			_jsii_.MemberProperty{JsiiProperty: "cwsContainer", GoGetter: "CwsContainer"},
			_jsii_.MemberProperty{JsiiProperty: "datadogContainer", GoGetter: "DatadogContainer"},
			_jsii_.MemberProperty{JsiiProperty: "defaultContainer", GoGetter: "DefaultContainer"},
			_jsii_.MemberProperty{JsiiProperty: "env", GoGetter: "Env"},
			_jsii_.MemberProperty{JsiiProperty: "ephemeralStorageGiB", GoGetter: "EphemeralStorageGiB"},
			_jsii_.MemberProperty{JsiiProperty: "executionRole", GoGetter: "ExecutionRole"},
			_jsii_.MemberProperty{JsiiProperty: "family", GoGetter: "Family"},
			_jsii_.MemberMethod{JsiiMethod: "findContainer", GoMethod: "FindContainer"},
			_jsii_.MemberMethod{JsiiMethod: "findPortMappingByName", GoMethod: "FindPortMappingByName"},
			_jsii_.MemberMethod{JsiiMethod: "generatePhysicalName", GoMethod: "GeneratePhysicalName"},
			_jsii_.MemberMethod{JsiiMethod: "getResourceArnAttribute", GoMethod: "GetResourceArnAttribute"},
			_jsii_.MemberMethod{JsiiMethod: "getResourceNameAttribute", GoMethod: "GetResourceNameAttribute"},
			_jsii_.MemberMethod{JsiiMethod: "grantRun", GoMethod: "GrantRun"},
			_jsii_.MemberProperty{JsiiProperty: "inferenceAccelerators", GoGetter: "InferenceAccelerators"},
			_jsii_.MemberProperty{JsiiProperty: "isEc2Compatible", GoGetter: "IsEc2Compatible"},
			_jsii_.MemberProperty{JsiiProperty: "isExternalCompatible", GoGetter: "IsExternalCompatible"},
			_jsii_.MemberProperty{JsiiProperty: "isFargateCompatible", GoGetter: "IsFargateCompatible"},
			_jsii_.MemberProperty{JsiiProperty: "logContainer", GoGetter: "LogContainer"},
			_jsii_.MemberProperty{JsiiProperty: "memoryMiB", GoGetter: "MemoryMiB"},
			_jsii_.MemberProperty{JsiiProperty: "networkMode", GoGetter: "NetworkMode"},
			_jsii_.MemberProperty{JsiiProperty: "node", GoGetter: "Node"},
			_jsii_.MemberMethod{JsiiMethod: "obtainExecutionRole", GoMethod: "ObtainExecutionRole"},
			_jsii_.MemberProperty{JsiiProperty: "physicalName", GoGetter: "PhysicalName"},
			_jsii_.MemberProperty{JsiiProperty: "pidMode", GoGetter: "PidMode"},
			_jsii_.MemberProperty{JsiiProperty: "referencesSecretJsonField", GoGetter: "ReferencesSecretJsonField"},
			_jsii_.MemberProperty{JsiiProperty: "stack", GoGetter: "Stack"},
			_jsii_.MemberProperty{JsiiProperty: "taskDefinitionArn", GoGetter: "TaskDefinitionArn"},
			_jsii_.MemberProperty{JsiiProperty: "taskRole", GoGetter: "TaskRole"},
			_jsii_.MemberMethod{JsiiMethod: "toString", GoMethod: "ToString"},
		},
		func() interface{} {
			j := jsiiProxy_DatadogECSFargateTaskDefinition{}
			_jsii_.InitJsiiProxy(&j.Type__awsecsFargateTaskDefinition)
			return &j
		},
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.DatadogECSLogDriverProps",
		reflect.TypeOf((*DatadogECSLogDriverProps)(nil)).Elem(),
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.DatadogFirelensOptions",
		reflect.TypeOf((*DatadogFirelensOptions)(nil)).Elem(),
	)
	_jsii_.RegisterClass(
		"datadog-cdk-constructs-v2.DatadogLambda",
		reflect.TypeOf((*DatadogLambda)(nil)).Elem(),
		[]_jsii_.Member{
			_jsii_.MemberMethod{JsiiMethod: "addForwarderToNonLambdaLogGroups", GoMethod: "AddForwarderToNonLambdaLogGroups"},
			_jsii_.MemberMethod{JsiiMethod: "addGitCommitMetadata", GoMethod: "AddGitCommitMetadata"},
			_jsii_.MemberMethod{JsiiMethod: "addLambdaFunctions", GoMethod: "AddLambdaFunctions"},
			_jsii_.MemberProperty{JsiiProperty: "contextGitShaOverrideKey", GoGetter: "ContextGitShaOverrideKey"},
			_jsii_.MemberProperty{JsiiProperty: "gitCommitShaOverride", GoGetter: "GitCommitShaOverride"},
			_jsii_.MemberProperty{JsiiProperty: "gitRepoUrlOverride", GoGetter: "GitRepoUrlOverride"},
			_jsii_.MemberProperty{JsiiProperty: "lambdas", GoGetter: "Lambdas"},
			_jsii_.MemberProperty{JsiiProperty: "node", GoGetter: "Node"},
			_jsii_.MemberMethod{JsiiMethod: "overrideGitMetadata", GoMethod: "OverrideGitMetadata"},
			_jsii_.MemberProperty{JsiiProperty: "props", GoGetter: "Props"},
			_jsii_.MemberProperty{JsiiProperty: "scope", GoGetter: "Scope"},
			_jsii_.MemberMethod{JsiiMethod: "toString", GoMethod: "ToString"},
			_jsii_.MemberProperty{JsiiProperty: "transport", GoGetter: "Transport"},
		},
		func() interface{} {
			j := jsiiProxy_DatadogLambda{}
			_jsii_.InitJsiiProxy(&j.Type__constructsConstruct)
			return &j
		},
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.DatadogLambdaProps",
		reflect.TypeOf((*DatadogLambdaProps)(nil)).Elem(),
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.DatadogLambdaStrictProps",
		reflect.TypeOf((*DatadogLambdaStrictProps)(nil)).Elem(),
	)
	_jsii_.RegisterClass(
		"datadog-cdk-constructs-v2.DatadogStepFunctions",
		reflect.TypeOf((*DatadogStepFunctions)(nil)).Elem(),
		[]_jsii_.Member{
			_jsii_.MemberMethod{JsiiMethod: "addStateMachines", GoMethod: "AddStateMachines"},
			_jsii_.MemberProperty{JsiiProperty: "node", GoGetter: "Node"},
			_jsii_.MemberProperty{JsiiProperty: "props", GoGetter: "Props"},
			_jsii_.MemberProperty{JsiiProperty: "scope", GoGetter: "Scope"},
			_jsii_.MemberProperty{JsiiProperty: "stack", GoGetter: "Stack"},
			_jsii_.MemberMethod{JsiiMethod: "toString", GoMethod: "ToString"},
		},
		func() interface{} {
			j := jsiiProxy_DatadogStepFunctions{}
			_jsii_.InitJsiiProxy(&j.Type__constructsConstruct)
			return &j
		},
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.DatadogStepFunctionsProps",
		reflect.TypeOf((*DatadogStepFunctionsProps)(nil)).Elem(),
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.DogstatsdFeatureConfig",
		reflect.TypeOf((*DogstatsdFeatureConfig)(nil)).Elem(),
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.FargateCWSFeatureConfig",
		reflect.TypeOf((*FargateCWSFeatureConfig)(nil)).Elem(),
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.FargateLogCollectionFeatureConfig",
		reflect.TypeOf((*FargateLogCollectionFeatureConfig)(nil)).Elem(),
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.FluentbitConfig",
		reflect.TypeOf((*FluentbitConfig)(nil)).Elem(),
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.LogCollectionFeatureConfig",
		reflect.TypeOf((*LogCollectionFeatureConfig)(nil)).Elem(),
	)
	_jsii_.RegisterEnum(
		"datadog-cdk-constructs-v2.LoggingType",
		reflect.TypeOf((*LoggingType)(nil)).Elem(),
		map[string]interface{}{
			"FLUENTBIT": LoggingType_FLUENTBIT,
		},
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.Node",
		reflect.TypeOf((*Node)(nil)).Elem(),
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.Runtime",
		reflect.TypeOf((*Runtime)(nil)).Elem(),
	)
	_jsii_.RegisterEnum(
		"datadog-cdk-constructs-v2.RuntimeType",
		reflect.TypeOf((*RuntimeType)(nil)).Elem(),
		map[string]interface{}{
			"DOTNET": RuntimeType_DOTNET,
			"NODE": RuntimeType_NODE,
			"PYTHON": RuntimeType_PYTHON,
			"JAVA": RuntimeType_JAVA,
			"RUBY": RuntimeType_RUBY,
			"CUSTOM": RuntimeType_CUSTOM,
			"UNSUPPORTED": RuntimeType_UNSUPPORTED,
		},
	)
	_jsii_.RegisterEnum(
		"datadog-cdk-constructs-v2.TagKeys",
		reflect.TypeOf((*TagKeys)(nil)).Elem(),
		map[string]interface{}{
			"CDK": TagKeys_CDK,
			"ENV": TagKeys_ENV,
			"SERVICE": TagKeys_SERVICE,
			"VERSION": TagKeys_VERSION,
			"DD_TRACE_ENABLED": TagKeys_DD_TRACE_ENABLED,
		},
	)
	_jsii_.RegisterClass(
		"datadog-cdk-constructs-v2.Transport",
		reflect.TypeOf((*Transport)(nil)).Elem(),
		[]_jsii_.Member{
			_jsii_.MemberProperty{JsiiProperty: "apiKey", GoGetter: "ApiKey"},
			_jsii_.MemberProperty{JsiiProperty: "apiKeySecretArn", GoGetter: "ApiKeySecretArn"},
			_jsii_.MemberProperty{JsiiProperty: "apiKmsKey", GoGetter: "ApiKmsKey"},
			_jsii_.MemberMethod{JsiiMethod: "applyEnvVars", GoMethod: "ApplyEnvVars"},
			_jsii_.MemberProperty{JsiiProperty: "extensionLayerArn", GoGetter: "ExtensionLayerArn"},
			_jsii_.MemberProperty{JsiiProperty: "extensionLayerVersion", GoGetter: "ExtensionLayerVersion"},
			_jsii_.MemberProperty{JsiiProperty: "flushMetricsToLogs", GoGetter: "FlushMetricsToLogs"},
			_jsii_.MemberProperty{JsiiProperty: "site", GoGetter: "Site"},
		},
		func() interface{} {
			return &jsiiProxy_Transport{}
		},
	)
}
