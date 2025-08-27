package ddcdkconstruct


type FargateLogCollectionFeatureConfig struct {
	// Enables log collection.
	IsEnabled *bool `field:"optional" json:"isEnabled" yaml:"isEnabled"`
	// Fluentbit log collection configuration.
	FluentbitConfig *FluentbitConfig `field:"optional" json:"fluentbitConfig" yaml:"fluentbitConfig"`
	// Type of log collection.
	LoggingType LoggingType `field:"optional" json:"loggingType" yaml:"loggingType"`
}

