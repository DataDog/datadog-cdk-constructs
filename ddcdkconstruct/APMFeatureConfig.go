package ddcdkconstruct


// APM feature configuration.
type APMFeatureConfig struct {
	// Enables APM.
	IsEnabled *bool `field:"optional" json:"isEnabled" yaml:"isEnabled"`
	// Enables Profile collection.
	//
	// Requires Datadog APM SSI instrumentation on your application containers.
	IsProfilingEnabled *bool `field:"optional" json:"isProfilingEnabled" yaml:"isProfilingEnabled"`
	// Enables APM traces traffic over Unix Domain Socket.
	//
	// Falls back to TCP configuration for application containers when disabled.
	IsSocketEnabled *bool `field:"optional" json:"isSocketEnabled" yaml:"isSocketEnabled"`
	// Enables inferred spans for proxy services like AWS API Gateway.
	//
	// When enabled, the tracer will create spans for proxy services by using headers
	// passed from the proxy service to the application.
	TraceInferredProxyServices *bool `field:"optional" json:"traceInferredProxyServices" yaml:"traceInferredProxyServices"`
}

