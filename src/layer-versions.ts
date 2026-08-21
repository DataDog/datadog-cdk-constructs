/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2026 Datadog, Inc.
 */

import { lambdaLayerCatalog } from "./layer-catalog";

/**
 * Default Datadog Lambda layer versions bundled with this construct. These are
 * used when a corresponding `*LayerVersion`/`*LayerArn` prop is not provided.
 * Exposed as a class so the values are available in all jsii languages.
 */
export class DatadogDefaultLayerVersions {
  public static readonly NODE = lambdaLayerCatalog.defaultLayerVersions.node;
  public static readonly PYTHON = lambdaLayerCatalog.defaultLayerVersions.python;
  public static readonly JAVA = lambdaLayerCatalog.defaultLayerVersions.java;
  public static readonly DOTNET = lambdaLayerCatalog.defaultLayerVersions.dotnet;
  public static readonly RUBY = lambdaLayerCatalog.defaultLayerVersions.ruby;
  public static readonly EXTENSION = lambdaLayerCatalog.defaultLayerVersions.extension;
}
