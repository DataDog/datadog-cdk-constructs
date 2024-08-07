// CDK Construct Library to automatically instrument Python and Node Lambda functions with Datadog using AWS CDK v2
package ddcdkconstruct

import (
	"reflect"

	_jsii_ "github.com/aws/jsii-runtime-go/runtime"
)

func init() {
	_jsii_.RegisterClass(
		"datadog-cdk-constructs-v2.Datadog",
		reflect.TypeOf((*Datadog)(nil)).Elem(),
		[]_jsii_.Member{
			_jsii_.MemberMethod{JsiiMethod: "addForwarderToNonLambdaLogGroups", GoMethod: "AddForwarderToNonLambdaLogGroups"},
			_jsii_.MemberMethod{JsiiMethod: "addGitCommitMetadata", GoMethod: "AddGitCommitMetadata"},
			_jsii_.MemberMethod{JsiiMethod: "addLambdaFunctions", GoMethod: "AddLambdaFunctions"},
			_jsii_.MemberProperty{JsiiProperty: "node", GoGetter: "Node"},
			_jsii_.MemberProperty{JsiiProperty: "props", GoGetter: "Props"},
			_jsii_.MemberProperty{JsiiProperty: "scope", GoGetter: "Scope"},
			_jsii_.MemberMethod{JsiiMethod: "toString", GoMethod: "ToString"},
			_jsii_.MemberProperty{JsiiProperty: "transport", GoGetter: "Transport"},
		},
		func() interface{} {
			j := jsiiProxy_Datadog{}
			_jsii_.InitJsiiProxy(&j.Type__constructsConstruct)
			return &j
		},
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.DatadogProps",
		reflect.TypeOf((*DatadogProps)(nil)).Elem(),
	)
	_jsii_.RegisterStruct(
		"datadog-cdk-constructs-v2.DatadogStrictProps",
		reflect.TypeOf((*DatadogStrictProps)(nil)).Elem(),
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
			_jsii_.MemberProperty{JsiiProperty: "extensionLayerVersion", GoGetter: "ExtensionLayerVersion"},
			_jsii_.MemberProperty{JsiiProperty: "flushMetricsToLogs", GoGetter: "FlushMetricsToLogs"},
			_jsii_.MemberProperty{JsiiProperty: "site", GoGetter: "Site"},
		},
		func() interface{} {
			return &jsiiProxy_Transport{}
		},
	)
}
