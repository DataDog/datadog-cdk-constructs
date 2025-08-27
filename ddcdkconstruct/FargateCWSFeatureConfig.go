package ddcdkconstruct


type FargateCWSFeatureConfig struct {
	// Enables CWS.
	IsEnabled *bool `field:"optional" json:"isEnabled" yaml:"isEnabled"`
	// The minimum number of CPU units to reserve for the Datadog CWS init container.
	Cpu *float64 `field:"optional" json:"cpu" yaml:"cpu"`
	// The amount (in MiB) of memory to present to the Datadog CWS init container.
	MemoryLimitMiB *float64 `field:"optional" json:"memoryLimitMiB" yaml:"memoryLimitMiB"`
}

