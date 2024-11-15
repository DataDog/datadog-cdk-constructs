package ddcdkconstruct


type DatadogStepFunctionsProps struct {
	Env *string `field:"optional" json:"env" yaml:"env"`
	ForwarderArn *string `field:"optional" json:"forwarderArn" yaml:"forwarderArn"`
	Service *string `field:"optional" json:"service" yaml:"service"`
	Tags *string `field:"optional" json:"tags" yaml:"tags"`
	Version *string `field:"optional" json:"version" yaml:"version"`
}

