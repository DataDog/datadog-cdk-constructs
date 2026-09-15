/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "aws-cdk-lib/aws-lambda";

// Pinned artifacts keep failures attributable to this construct's wiring.
export const E2E_RUNTIME = lambda.Runtime.NODEJS_22_X;
export const E2E_NODE_LAYER_VERSION = 130;
export const E2E_EXTENSION_LAYER_VERSION = 83;
