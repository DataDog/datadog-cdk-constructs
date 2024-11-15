package ddcdkconstruct

import (
	"github.com/aws/aws-cdk-go/awscdk/v2/awssecretsmanager"
)

// For backward compatibility.
//
// It's recommended to use DatadogLambdaProps for
// users who want to add Datadog monitoring for Lambda functions.
type DatadogProps struct {
	AddLayers *bool `field:"optional" json:"addLayers" yaml:"addLayers"`
	ApiKey *string `field:"optional" json:"apiKey" yaml:"apiKey"`
	ApiKeySecret awssecretsmanager.ISecret `field:"optional" json:"apiKeySecret" yaml:"apiKeySecret"`
	ApiKeySecretArn *string `field:"optional" json:"apiKeySecretArn" yaml:"apiKeySecretArn"`
	ApiKmsKey *string `field:"optional" json:"apiKmsKey" yaml:"apiKmsKey"`
	ApmFlushDeadline interface{} `field:"optional" json:"apmFlushDeadline" yaml:"apmFlushDeadline"`
	CaptureLambdaPayload *bool `field:"optional" json:"captureLambdaPayload" yaml:"captureLambdaPayload"`
	ColdStartTraceSkipLibs *string `field:"optional" json:"coldStartTraceSkipLibs" yaml:"coldStartTraceSkipLibs"`
	CreateForwarderPermissions *bool `field:"optional" json:"createForwarderPermissions" yaml:"createForwarderPermissions"`
	DecodeAuthorizerContext *bool `field:"optional" json:"decodeAuthorizerContext" yaml:"decodeAuthorizerContext"`
	DotnetLayerVersion *float64 `field:"optional" json:"dotnetLayerVersion" yaml:"dotnetLayerVersion"`
	EnableColdStartTracing *bool `field:"optional" json:"enableColdStartTracing" yaml:"enableColdStartTracing"`
	EnableDatadogASM *bool `field:"optional" json:"enableDatadogASM" yaml:"enableDatadogASM"`
	EnableDatadogLogs *bool `field:"optional" json:"enableDatadogLogs" yaml:"enableDatadogLogs"`
	EnableDatadogTracing *bool `field:"optional" json:"enableDatadogTracing" yaml:"enableDatadogTracing"`
	EnableMergeXrayTraces *bool `field:"optional" json:"enableMergeXrayTraces" yaml:"enableMergeXrayTraces"`
	EnableProfiling *bool `field:"optional" json:"enableProfiling" yaml:"enableProfiling"`
	EncodeAuthorizerContext *bool `field:"optional" json:"encodeAuthorizerContext" yaml:"encodeAuthorizerContext"`
	Env *string `field:"optional" json:"env" yaml:"env"`
	ExtensionLayerVersion *float64 `field:"optional" json:"extensionLayerVersion" yaml:"extensionLayerVersion"`
	FlushMetricsToLogs *bool `field:"optional" json:"flushMetricsToLogs" yaml:"flushMetricsToLogs"`
	ForwarderArn *string `field:"optional" json:"forwarderArn" yaml:"forwarderArn"`
	GrantSecretReadAccess *bool `field:"optional" json:"grantSecretReadAccess" yaml:"grantSecretReadAccess"`
	InjectLogContext *bool `field:"optional" json:"injectLogContext" yaml:"injectLogContext"`
	JavaLayerVersion *float64 `field:"optional" json:"javaLayerVersion" yaml:"javaLayerVersion"`
	LogLevel *string `field:"optional" json:"logLevel" yaml:"logLevel"`
	MinColdStartTraceDuration *float64 `field:"optional" json:"minColdStartTraceDuration" yaml:"minColdStartTraceDuration"`
	NodeLayerVersion *float64 `field:"optional" json:"nodeLayerVersion" yaml:"nodeLayerVersion"`
	PythonLayerVersion *float64 `field:"optional" json:"pythonLayerVersion" yaml:"pythonLayerVersion"`
	RedirectHandler *bool `field:"optional" json:"redirectHandler" yaml:"redirectHandler"`
	Service *string `field:"optional" json:"service" yaml:"service"`
	Site *string `field:"optional" json:"site" yaml:"site"`
	SourceCodeIntegration *bool `field:"optional" json:"sourceCodeIntegration" yaml:"sourceCodeIntegration"`
	Tags *string `field:"optional" json:"tags" yaml:"tags"`
	UseLayersFromAccount *string `field:"optional" json:"useLayersFromAccount" yaml:"useLayersFromAccount"`
	Version *string `field:"optional" json:"version" yaml:"version"`
}

