package ddcdkconstruct

import (
	"github.com/aws/aws-cdk-go/awscdk/v2/awsecs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssecretsmanager"
)

type DatadogECSFargateProps struct {
	// The Datadog API key string.
	//
	// Must define at least 1 source for the API key.
	ApiKey *string `field:"optional" json:"apiKey" yaml:"apiKey"`
	// The Datadog API key secret.
	//
	// Must define at least 1 source for the API key.
	ApiKeySecret awssecretsmanager.ISecret `field:"optional" json:"apiKeySecret" yaml:"apiKeySecret"`
	// The ARN of the Datadog API key secret.
	//
	// Must define at least 1 source for the API key.
	ApiKeySecretArn *string `field:"optional" json:"apiKeySecretArn" yaml:"apiKeySecretArn"`
	// APM feature configuration.
	Apm *APMFeatureConfig `field:"optional" json:"apm" yaml:"apm"`
	// The Datadog Agent checks tag cardinality.
	ChecksCardinality Cardinality `field:"optional" json:"checksCardinality" yaml:"checksCardinality"`
	// The cluster name to use for tagging.
	ClusterName *string `field:"optional" json:"clusterName" yaml:"clusterName"`
	// The minimum number of CPU units to reserve for the Datadog Agent container.
	Cpu *float64 `field:"optional" json:"cpu" yaml:"cpu"`
	// Configure health check for the Datadog Agent container.
	DatadogHealthCheck *awsecs.HealthCheck `field:"optional" json:"datadogHealthCheck" yaml:"datadogHealthCheck"`
	// DogStatsD feature configuration.
	Dogstatsd *DogstatsdFeatureConfig `field:"optional" json:"dogstatsd" yaml:"dogstatsd"`
	// The task environment name.
	//
	// Used for tagging (UST).
	Env *string `field:"optional" json:"env" yaml:"env"`
	// Datadog Agent environment variables.
	EnvironmentVariables *map[string]*string `field:"optional" json:"environmentVariables" yaml:"environmentVariables"`
	// Global tags to apply to all data sent by the Agent.
	//
	// Overrides any DD_TAGS values in environmentVariables.
	GlobalTags *string `field:"optional" json:"globalTags" yaml:"globalTags"`
	// The version of the Datadog Agent container image to use.
	ImageVersion *string `field:"optional" json:"imageVersion" yaml:"imageVersion"`
	// Configure added containers to have container dependency on the Datadog Agent container.
	IsDatadogDependencyEnabled *bool `field:"optional" json:"isDatadogDependencyEnabled" yaml:"isDatadogDependencyEnabled"`
	// Configure Datadog Agent container to be essential for the task.
	IsDatadogEssential *bool `field:"optional" json:"isDatadogEssential" yaml:"isDatadogEssential"`
	// The amount (in MiB) of memory to present to the Datadog Agent container.
	MemoryLimitMiB *float64 `field:"optional" json:"memoryLimitMiB" yaml:"memoryLimitMiB"`
	// The registry to pull the Datadog Agent container image from.
	Registry *string `field:"optional" json:"registry" yaml:"registry"`
	// The task service name.
	//
	// Used for tagging (UST).
	Service *string `field:"optional" json:"service" yaml:"service"`
	// The Datadog site to send data to.
	Site *string `field:"optional" json:"site" yaml:"site"`
	// The task version.
	//
	// Used for tagging (UST).
	Version *string `field:"optional" json:"version" yaml:"version"`
	Cws *FargateCWSFeatureConfig `field:"optional" json:"cws" yaml:"cws"`
	LogCollection *FargateLogCollectionFeatureConfig `field:"optional" json:"logCollection" yaml:"logCollection"`
}

