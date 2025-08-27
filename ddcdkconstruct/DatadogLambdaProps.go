package ddcdkconstruct

import (
	"github.com/aws/aws-cdk-go/awscdk/v2/awssecretsmanager"
)

type DatadogLambdaProps struct {
	AddLayers *bool `field:"optional" json:"addLayers" yaml:"addLayers"`
	ApiKey *string `field:"optional" json:"apiKey" yaml:"apiKey"`
	ApiKeySecret awssecretsmanager.ISecret `field:"optional" json:"apiKeySecret" yaml:"apiKeySecret"`
	ApiKeySecretArn *string `field:"optional" json:"apiKeySecretArn" yaml:"apiKeySecretArn"`
	ApiKmsKey *string `field:"optional" json:"apiKmsKey" yaml:"apiKmsKey"`
	ApmFlushDeadline interface{} `field:"optional" json:"apmFlushDeadline" yaml:"apmFlushDeadline"`
	CaptureCloudServicePayload *bool `field:"optional" json:"captureCloudServicePayload" yaml:"captureCloudServicePayload"`
	CaptureLambdaPayload *bool `field:"optional" json:"captureLambdaPayload" yaml:"captureLambdaPayload"`
	ColdStartTraceSkipLibs *string `field:"optional" json:"coldStartTraceSkipLibs" yaml:"coldStartTraceSkipLibs"`
	CreateForwarderPermissions *bool `field:"optional" json:"createForwarderPermissions" yaml:"createForwarderPermissions"`
	DecodeAuthorizerContext *bool `field:"optional" json:"decodeAuthorizerContext" yaml:"decodeAuthorizerContext"`
	DotnetLayerArn *string `field:"optional" json:"dotnetLayerArn" yaml:"dotnetLayerArn"`
	DotnetLayerVersion *float64 `field:"optional" json:"dotnetLayerVersion" yaml:"dotnetLayerVersion"`
	EnableColdStartTracing *bool `field:"optional" json:"enableColdStartTracing" yaml:"enableColdStartTracing"`
	EnableDatadogASM *bool `field:"optional" json:"enableDatadogASM" yaml:"enableDatadogASM"`
	EnableDatadogLogs *bool `field:"optional" json:"enableDatadogLogs" yaml:"enableDatadogLogs"`
	EnableDatadogTracing *bool `field:"optional" json:"enableDatadogTracing" yaml:"enableDatadogTracing"`
	EnableMergeXrayTraces *bool `field:"optional" json:"enableMergeXrayTraces" yaml:"enableMergeXrayTraces"`
	EnableProfiling *bool `field:"optional" json:"enableProfiling" yaml:"enableProfiling"`
	EncodeAuthorizerContext *bool `field:"optional" json:"encodeAuthorizerContext" yaml:"encodeAuthorizerContext"`
	Env *string `field:"optional" json:"env" yaml:"env"`
	ExtensionLayerArn *string `field:"optional" json:"extensionLayerArn" yaml:"extensionLayerArn"`
	ExtensionLayerVersion *float64 `field:"optional" json:"extensionLayerVersion" yaml:"extensionLayerVersion"`
	FlushMetricsToLogs *bool `field:"optional" json:"flushMetricsToLogs" yaml:"flushMetricsToLogs"`
	ForwarderArn *string `field:"optional" json:"forwarderArn" yaml:"forwarderArn"`
	GrantSecretReadAccess *bool `field:"optional" json:"grantSecretReadAccess" yaml:"grantSecretReadAccess"`
	InjectLogContext *bool `field:"optional" json:"injectLogContext" yaml:"injectLogContext"`
	JavaLayerArn *string `field:"optional" json:"javaLayerArn" yaml:"javaLayerArn"`
	JavaLayerVersion *float64 `field:"optional" json:"javaLayerVersion" yaml:"javaLayerVersion"`
	LlmObsAgentlessEnabled *bool `field:"optional" json:"llmObsAgentlessEnabled" yaml:"llmObsAgentlessEnabled"`
	LlmObsEnabled *bool `field:"optional" json:"llmObsEnabled" yaml:"llmObsEnabled"`
	LlmObsMlApp *string `field:"optional" json:"llmObsMlApp" yaml:"llmObsMlApp"`
	LogLevel *string `field:"optional" json:"logLevel" yaml:"logLevel"`
	MinColdStartTraceDuration *float64 `field:"optional" json:"minColdStartTraceDuration" yaml:"minColdStartTraceDuration"`
	NodeLayerArn *string `field:"optional" json:"nodeLayerArn" yaml:"nodeLayerArn"`
	NodeLayerVersion *float64 `field:"optional" json:"nodeLayerVersion" yaml:"nodeLayerVersion"`
	PythonLayerArn *string `field:"optional" json:"pythonLayerArn" yaml:"pythonLayerArn"`
	PythonLayerVersion *float64 `field:"optional" json:"pythonLayerVersion" yaml:"pythonLayerVersion"`
	RedirectHandler *bool `field:"optional" json:"redirectHandler" yaml:"redirectHandler"`
	RubyLayerArn *string `field:"optional" json:"rubyLayerArn" yaml:"rubyLayerArn"`
	RubyLayerVersion *float64 `field:"optional" json:"rubyLayerVersion" yaml:"rubyLayerVersion"`
	Service *string `field:"optional" json:"service" yaml:"service"`
	Site *string `field:"optional" json:"site" yaml:"site"`
	SourceCodeIntegration *bool `field:"optional" json:"sourceCodeIntegration" yaml:"sourceCodeIntegration"`
	Tags *string `field:"optional" json:"tags" yaml:"tags"`
	UseLayersFromAccount *string `field:"optional" json:"useLayersFromAccount" yaml:"useLayersFromAccount"`
	Version *string `field:"optional" json:"version" yaml:"version"`
}

