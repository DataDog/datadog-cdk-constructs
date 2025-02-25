/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { HealthCheck } from "aws-cdk-lib/aws-ecs";
import { EnvVarManager } from "../environment";
import { DatadogECSBaseProps } from "../interfaces";

export interface DatadogECSFargateProps extends DatadogECSBaseProps {
  readonly logDriverConfiguration?: DatadogECSFargateLogDriverProps;
  readonly logRouterHealthCheck?: HealthCheck;
  readonly isLogRouterHealthCheckEnabled?: boolean;
}

export interface DatadogECSFargateLogDriverProps {
  readonly registry?: string;
  readonly hostEndpoint?: string;
  readonly messageKey?: string;
  readonly serviceName?: string;
  readonly sourceName?: string;
  readonly imageVersion?: string;
}

/**
 * Internal props for the Datadog ECS Fargate construct
 */
export interface DatadogECSFargateInternalProps extends DatadogECSFargateProps {
  readonly envVarManager: EnvVarManager;
  readonly isLinux: boolean;
  readonly entryPointsDefined?: boolean;
  readonly entryPoint?: string[];
}
