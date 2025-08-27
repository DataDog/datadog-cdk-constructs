package ddcdkconstruct


// Type of datadog logging configuration.
type LoggingType string

const (
	// Forwarding logs to Datadog using Fluentbit container.
	//
	// Only compatible on Linux.
	LoggingType_FLUENTBIT LoggingType = "FLUENTBIT"
)

