/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { FargateDefaultEnvVars } from "./constants";
import { DatadogECSFargateProps } from "./interfaces";
import { EnvVarManager } from "../environment";

export class FargateEnvVarManager extends EnvVarManager {
  constructor(props: DatadogECSFargateProps) {
    super(FargateDefaultEnvVars);

    this.addAll(props.environmentVariables);

    this.add("DD_API_KEY", props.apiKey);
    this.add("DD_SITE", props.site);
    this.add("DD_ENV", props.env);
    this.add("DD_SERVICE", props.service);
    this.add("DD_VERSION", props.version);
    this.add("DD_TAGS", props.globalTags);
    this.add("DD_CLUSTER_NAME", props.clusterName);

    if (props.dogstatsd!.isOriginDetectionEnabled) {
      this.add("DD_DOGSTATSD_ORIGIN_DETECTION", "true");
      this.add("DD_DOGSTATSD_ORIGIN_DETECTION_CLIENT", "true");
    }

    if (props.cws!.isEnabled) {
      this.add("DD_RUNTIME_SECURITY_CONFIG_ENABLED", "true");
      this.add("DD_RUNTIME_SECURITY_CONFIG_EBPFLESS_ENABLED", "true");
    }
  }
}
