package ddcdkconstruct


// Datadog Fluentbit log driver configuration.
//
// https://docs.fluentbit.io/manual/pipeline/outputs/datadog
type DatadogECSLogDriverProps struct {
	Compress *string `field:"optional" json:"compress" yaml:"compress"`
	HostEndpoint *string `field:"optional" json:"hostEndpoint" yaml:"hostEndpoint"`
	MessageKey *string `field:"optional" json:"messageKey" yaml:"messageKey"`
	ServiceName *string `field:"optional" json:"serviceName" yaml:"serviceName"`
	SourceName *string `field:"optional" json:"sourceName" yaml:"sourceName"`
	Tls *string `field:"optional" json:"tls" yaml:"tls"`
}

