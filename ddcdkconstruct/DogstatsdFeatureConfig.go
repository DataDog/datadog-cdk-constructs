package ddcdkconstruct


// Dogstatsd feature configuration.
type DogstatsdFeatureConfig struct {
	// Controls the cardinality of custom dogstatsd metrics.
	DogstatsdCardinality Cardinality `field:"optional" json:"dogstatsdCardinality" yaml:"dogstatsdCardinality"`
	// Enables Dogstatsd.
	IsEnabled *bool `field:"optional" json:"isEnabled" yaml:"isEnabled"`
	// Enables Dogstatsd origin detection.
	IsOriginDetectionEnabled *bool `field:"optional" json:"isOriginDetectionEnabled" yaml:"isOriginDetectionEnabled"`
	// Enables Dogstatsd traffic over Unix Domain Socket.
	//
	// Falls back to UDP configuration for application containers when disabled.
	IsSocketEnabled *bool `field:"optional" json:"isSocketEnabled" yaml:"isSocketEnabled"`
}

