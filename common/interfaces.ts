/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

export interface DatadogProps {
  readonly pythonLayerVersion?: number;
  readonly nodeLayerVersion?: number;
  readonly javaLayerVersion?: number;
  readonly extensionLayerVersion?: number;
  readonly addLayers?: boolean;
  readonly forwarderArn?: string;
  readonly flushMetricsToLogs?: boolean;
  readonly site?: string;
  readonly apiKey?: string;
  readonly apiKeySecretArn?: string;
  readonly apiKmsKey?: string;
  readonly enableDatadogTracing?: boolean;
  readonly enableMergeXrayTraces?: boolean;
  readonly injectLogContext?: boolean;
  readonly logLevel?: string;
  readonly enableDatadogLogs?: boolean;
  readonly captureLambdaPayload?: boolean;
  readonly env?: string;
  readonly service?: string;
  readonly version?: string;
  readonly tags?: string;
  readonly createForwarderPermissions?: boolean;
  readonly sourceCodeIntegration?: boolean;
}

/*
 * Makes fields shared with DefaultDatadogProps (in constants file) required.
 */
export interface DatadogStrictProps {
  readonly addLayers: boolean;
  readonly enableDatadogLogs: boolean;
  readonly captureLambdaPayload: boolean;
  readonly injectLogContext: boolean;
  readonly enableDatadogTracing: boolean;
  readonly enableMergeXrayTraces: boolean;
  readonly pythonLayerVersion?: number;
  readonly nodeLayerVersion?: number;
  readonly javaLayerVersion?: number;
  readonly extensionLayerVersion?: number;
  readonly forwarderArn?: string;
  readonly flushMetricsToLogs?: boolean;
  readonly site?: string;
  readonly apiKey?: string;
  readonly apiKeySecretArn?: string;
  readonly apiKmsKey?: string;
  readonly logLevel?: string;
  readonly sourceCodeIntegration?: boolean;
}

export interface Runtime {
  readonly name: string;
}

export interface Node {
  readonly defaultChild: any;
}

export interface ILambdaFunction {
  runtime: Runtime;
  node: Node;
  addEnvironment(key: string, value: string, options?: Record<string, unknown>): void;
}
