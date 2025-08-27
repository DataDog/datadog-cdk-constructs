package ddcdkconstruct

import (
	"github.com/aws/aws-cdk-go/awscdk/v2/awsecs"
)

type DatadogFirelensOptions struct {
	// Custom configuration file, s3 or file.
	//
	// Both configFileType and configFileValue must be used together
	// to define a custom configuration source.
	// Default: - determined by checking configFileValue with S3 ARN.
	//
	ConfigFileType awsecs.FirelensConfigFileType `field:"optional" json:"configFileType" yaml:"configFileType"`
	// Custom configuration file, S3 ARN or a file path Both configFileType and configFileValue must be used together to define a custom configuration source.
	// Default: - no config file value.
	//
	ConfigFileValue *string `field:"optional" json:"configFileValue" yaml:"configFileValue"`
	// By default, Amazon ECS adds additional fields in your log entries that help identify the source of the logs.
	//
	// You can disable this action by setting enable-ecs-log-metadata to false.
	// Default: - true.
	//
	EnableECSLogMetadata *bool `field:"optional" json:"enableECSLogMetadata" yaml:"enableECSLogMetadata"`
	// Overrides the config file type and value to support JSON parsing.
	IsParseJson *bool `field:"optional" json:"isParseJson" yaml:"isParseJson"`
}

