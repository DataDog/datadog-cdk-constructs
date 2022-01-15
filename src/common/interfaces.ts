export interface DatadogProps {
  readonly pythonLayerVersion?: number;
  readonly nodeLayerVersion?: number;
  readonly extensionLayerVersion?: number;
  readonly addLayers?: boolean;
  readonly forwarderArn?: string;
  readonly flushMetricsToLogs?: boolean;
  readonly site?: string;
  readonly apiKey?: string;
  readonly apiKeySecretArn?: string;
  readonly apiKmsKey?: string;
  readonly enableDatadogTracing?: boolean;
  readonly injectLogContext?: boolean;
  readonly logLevel?: string;
  readonly enableDatadogLogs?: boolean;
  readonly captureLambdaPayload?: boolean;
}

export interface LambdaFunction {
  addEnvironment(ey: string, value: string, options?: Record<string, unknown>): any;
}
