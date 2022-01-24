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

/*
 * Makes fields shared with DefaultDatadogProps (in constants file) required.
 *
 * Cannot use "extends DatadogProps" or "extends Omit<DatadogProps, "addLayers" | "enableDatadogLogs"...>"
 * Due to JSII typescript restrictions.
 *
 * TODO: Research better way to create this second interface
 */
export interface DatadogStrictProps {
  readonly addLayers: boolean;
  readonly enableDatadogLogs: boolean;
  readonly captureLambdaPayload: boolean;
  readonly injectLogContext: boolean;
  readonly enableDatadogTracing: boolean;
  readonly pythonLayerVersion?: number;
  readonly nodeLayerVersion?: number;
  readonly extensionLayerVersion?: number;
  readonly forwarderArn?: string;
  readonly flushMetricsToLogs?: boolean;
  readonly site?: string;
  readonly apiKey?: string;
  readonly apiKeySecretArn?: string;
  readonly apiKmsKey?: string;
  readonly logLevel?: string;
}

export interface ILambdaFunction {
  runtime: any;
  node: any;
  addEnvironment(ey: string, value: string, options?: Record<string, unknown>): unknown;
}
