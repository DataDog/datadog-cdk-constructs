/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "aws-cdk-lib/aws-lambda";
import * as secrets from "aws-cdk-lib/aws-secretsmanager";

export interface DatadogLambdaProps {
  readonly dotnetLayerVersion?: number;
  readonly dotnetLayerArn?: string;
  readonly pythonLayerVersion?: number;
  readonly pythonLayerArn?: string;
  readonly nodeLayerVersion?: number;
  readonly nodeLayerArn?: string;
  readonly javaLayerVersion?: number;
  readonly javaLayerArn?: string;
  readonly rubyLayerVersion?: number;
  readonly rubyLayerArn?: string;
  readonly extensionLayerVersion?: number;
  readonly extensionLayerArn?: string;
  readonly addLayers?: boolean;
  readonly forwarderArn?: string;
  readonly flushMetricsToLogs?: boolean;
  readonly site?: string;
  readonly apiKey?: string;
  readonly apiKeySecretArn?: string;
  readonly apiKeySecret?: secrets.ISecret;
  readonly apiKmsKey?: string;
  readonly enableDatadogTracing?: boolean;
  readonly enableDatadogASM?: boolean;
  readonly enableMergeXrayTraces?: boolean;
  readonly injectLogContext?: boolean;
  readonly logLevel?: string;
  readonly enableDatadogLogs?: boolean;
  readonly captureLambdaPayload?: boolean;
  readonly captureCloudServicePayload?: boolean;
  readonly env?: string;
  readonly service?: string;
  readonly version?: string;
  readonly tags?: string;
  readonly createForwarderPermissions?: boolean;
  readonly sourceCodeIntegration?: boolean;
  readonly enableColdStartTracing?: boolean;
  readonly minColdStartTraceDuration?: number;
  readonly coldStartTraceSkipLibs?: string;
  readonly enableProfiling?: boolean;
  readonly encodeAuthorizerContext?: boolean;
  readonly decodeAuthorizerContext?: boolean;
  readonly apmFlushDeadline?: string | number;
  readonly redirectHandler?: boolean;
  readonly grantSecretReadAccess?: boolean;
  readonly useLayersFromAccount?: string;
  readonly llmObsEnabled?: boolean;
  readonly llmObsMlApp?: string;
  readonly llmObsAgentlessEnabled?: boolean;
}

/*
 * Makes fields shared with DefaultDatadogLambdaProps (in constants file) required.
 */
export interface DatadogLambdaStrictProps {
  readonly addLayers: boolean;
  readonly enableDatadogLogs: boolean;
  readonly captureLambdaPayload: boolean;
  readonly captureCloudServicePayload: boolean;
  readonly injectLogContext: boolean;
  readonly enableDatadogTracing: boolean;
  readonly enableDatadogASM: boolean;
  readonly enableMergeXrayTraces: boolean;
  readonly grantSecretReadAccess: boolean;
  readonly pythonLayerVersion?: number;
  readonly pythonLayerArn?: string;
  readonly nodeLayerVersion?: number;
  readonly nodeLayerArn?: string;
  readonly javaLayerVersion?: number;
  readonly javaLayerArn?: string;
  readonly extensionLayerVersion?: number;
  readonly extensionLayerArn?: string;
  readonly forwarderArn?: string;
  readonly flushMetricsToLogs?: boolean;
  readonly site?: string;
  readonly apiKey?: string;
  readonly apiKeySecretArn?: string;
  readonly apiKeySecret?: secrets.ISecret;
  readonly apiKmsKey?: string;
  readonly logLevel?: string;
  readonly sourceCodeIntegration?: boolean;
  readonly redirectHandler?: boolean;
}

export interface Runtime {
  readonly name: string;
}

export interface Node {
  readonly defaultChild: any;
}

export type LambdaFunction = lambda.Function | lambda.SingletonFunction;

export interface DatadogStepFunctionsProps {
  readonly env?: string;
  readonly service?: string;
  readonly version?: string;
  readonly forwarderArn?: string;
  readonly tags?: string;
}
