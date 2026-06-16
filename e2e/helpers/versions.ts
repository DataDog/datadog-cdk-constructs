/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as lambda from "aws-cdk-lib/aws-lambda";

// Pinned artifact versions. Pinning the layer/extension versions (and the single
// canonical runtime) means an e2e failure blames this construct's wiring, not an
// upstream layer/tracer change. Bump deliberately. See spec.md ("Rules").
export const E2E_RUNTIME = lambda.Runtime.NODEJS_22_X;

// `Datadog-Node22-x` layer version.
export const E2E_NODE_LAYER_VERSION = 130;
// `Datadog-Extension` layer version.
export const E2E_EXTENSION_LAYER_VERSION = 83;
