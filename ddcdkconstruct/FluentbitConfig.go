package ddcdkconstruct

import (
	"github.com/aws/aws-cdk-go/awscdk/v2/awsecs"
)

type FluentbitConfig struct {
	// The minimum number of CPU units to reserve for the Datadog fluent-bit container.
	Cpu *float64 `field:"optional" json:"cpu" yaml:"cpu"`
	// Firelens options for the Fluentbit container.
	FirelensOptions *DatadogFirelensOptions `field:"optional" json:"firelensOptions" yaml:"firelensOptions"`
	// The version of the Fluentbit container image to use.
	ImageVersion *string `field:"optional" json:"imageVersion" yaml:"imageVersion"`
	// Enables the log router health check.
	IsLogRouterDependencyEnabled *bool `field:"optional" json:"isLogRouterDependencyEnabled" yaml:"isLogRouterDependencyEnabled"`
	// Makes the log router essential.
	IsLogRouterEssential *bool `field:"optional" json:"isLogRouterEssential" yaml:"isLogRouterEssential"`
	// Configuration for the Datadog log driver.
	LogDriverConfig *DatadogECSLogDriverProps `field:"optional" json:"logDriverConfig" yaml:"logDriverConfig"`
	// Health check configuration for the log router.
	LogRouterHealthCheck *awsecs.HealthCheck `field:"optional" json:"logRouterHealthCheck" yaml:"logRouterHealthCheck"`
	// The amount (in MiB) of memory to present to the Datadog fluent-bit container.
	MemoryLimitMiB *float64 `field:"optional" json:"memoryLimitMiB" yaml:"memoryLimitMiB"`
	// The registry to pull the Fluentbit container image from.
	Registry *string `field:"optional" json:"registry" yaml:"registry"`
}

