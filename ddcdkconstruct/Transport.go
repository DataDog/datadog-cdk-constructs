package ddcdkconstruct

import (
	_jsii_ "github.com/aws/jsii-runtime-go/runtime"
	_init_ "github.com/DataDog/datadog-cdk-constructs-go/ddcdkconstruct/v3/jsii"

	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
)

type Transport interface {
	ApiKey() *string
	SetApiKey(val *string)
	ApiKeySecretArn() *string
	SetApiKeySecretArn(val *string)
	ApiKmsKey() *string
	SetApiKmsKey(val *string)
	ExtensionLayerArn() *string
	SetExtensionLayerArn(val *string)
	ExtensionLayerVersion() *float64
	SetExtensionLayerVersion(val *float64)
	FlushMetricsToLogs() *bool
	SetFlushMetricsToLogs(val *bool)
	Site() *string
	SetSite(val *string)
	ApplyEnvVars(lam awslambda.Function)
}

// The jsii proxy struct for Transport
type jsiiProxy_Transport struct {
	_ byte // padding
}

func (j *jsiiProxy_Transport) ApiKey() *string {
	var returns *string
	_jsii_.Get(
		j,
		"apiKey",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_Transport) ApiKeySecretArn() *string {
	var returns *string
	_jsii_.Get(
		j,
		"apiKeySecretArn",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_Transport) ApiKmsKey() *string {
	var returns *string
	_jsii_.Get(
		j,
		"apiKmsKey",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_Transport) ExtensionLayerArn() *string {
	var returns *string
	_jsii_.Get(
		j,
		"extensionLayerArn",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_Transport) ExtensionLayerVersion() *float64 {
	var returns *float64
	_jsii_.Get(
		j,
		"extensionLayerVersion",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_Transport) FlushMetricsToLogs() *bool {
	var returns *bool
	_jsii_.Get(
		j,
		"flushMetricsToLogs",
		&returns,
	)
	return returns
}

func (j *jsiiProxy_Transport) Site() *string {
	var returns *string
	_jsii_.Get(
		j,
		"site",
		&returns,
	)
	return returns
}


func NewTransport(flushMetricsToLogs *bool, site *string, apiKey *string, apiKeySecretArn *string, apiKmsKey *string, extensionLayerVersion *float64, extensionLayerArn *string) Transport {
	_init_.Initialize()

	j := jsiiProxy_Transport{}

	_jsii_.Create(
		"datadog-cdk-constructs-v2.Transport",
		[]interface{}{flushMetricsToLogs, site, apiKey, apiKeySecretArn, apiKmsKey, extensionLayerVersion, extensionLayerArn},
		&j,
	)

	return &j
}

func NewTransport_Override(t Transport, flushMetricsToLogs *bool, site *string, apiKey *string, apiKeySecretArn *string, apiKmsKey *string, extensionLayerVersion *float64, extensionLayerArn *string) {
	_init_.Initialize()

	_jsii_.Create(
		"datadog-cdk-constructs-v2.Transport",
		[]interface{}{flushMetricsToLogs, site, apiKey, apiKeySecretArn, apiKmsKey, extensionLayerVersion, extensionLayerArn},
		t,
	)
}

func (j *jsiiProxy_Transport)SetApiKey(val *string) {
	_jsii_.Set(
		j,
		"apiKey",
		val,
	)
}

func (j *jsiiProxy_Transport)SetApiKeySecretArn(val *string) {
	_jsii_.Set(
		j,
		"apiKeySecretArn",
		val,
	)
}

func (j *jsiiProxy_Transport)SetApiKmsKey(val *string) {
	_jsii_.Set(
		j,
		"apiKmsKey",
		val,
	)
}

func (j *jsiiProxy_Transport)SetExtensionLayerArn(val *string) {
	_jsii_.Set(
		j,
		"extensionLayerArn",
		val,
	)
}

func (j *jsiiProxy_Transport)SetExtensionLayerVersion(val *float64) {
	_jsii_.Set(
		j,
		"extensionLayerVersion",
		val,
	)
}

func (j *jsiiProxy_Transport)SetFlushMetricsToLogs(val *bool) {
	if err := j.validateSetFlushMetricsToLogsParameters(val); err != nil {
		panic(err)
	}
	_jsii_.Set(
		j,
		"flushMetricsToLogs",
		val,
	)
}

func (j *jsiiProxy_Transport)SetSite(val *string) {
	if err := j.validateSetSiteParameters(val); err != nil {
		panic(err)
	}
	_jsii_.Set(
		j,
		"site",
		val,
	)
}

func (t *jsiiProxy_Transport) ApplyEnvVars(lam awslambda.Function) {
	if err := t.validateApplyEnvVarsParameters(lam); err != nil {
		panic(err)
	}
	_jsii_.InvokeVoid(
		t,
		"applyEnvVars",
		[]interface{}{lam},
	)
}

