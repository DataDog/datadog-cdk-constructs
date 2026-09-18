/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import { Secret } from "aws-cdk-lib/aws-ecs";
import { EnvVarManager } from "../environment";
import { DatadogECSManagedInstancesProps } from "./interfaces";

/**
 * Internal props for the Datadog ECS Managed Instances construct.
 */
export interface DatadogECSManagedInstancesInternalProps extends DatadogECSManagedInstancesProps {
  readonly envVarManager: EnvVarManager;
  readonly isSocketRequired: boolean;
  readonly isProtocolRequired: boolean;
  readonly datadogSecret?: Secret;
}
