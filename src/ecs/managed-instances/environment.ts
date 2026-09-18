/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2020-2026 Datadog, Inc.
 */

import log from "loglevel";
import { DaemonBridgeIpv4, ManagedInstancesDefaultEnvVars } from "./constants";
import { DatadogECSManagedInstancesProps } from "./interfaces";
import * as versionJson from "../../../version.json";
import { EnvVarManager } from "../environment";

export class ManagedInstancesEnvVarManager extends EnvVarManager {
  constructor(props: DatadogECSManagedInstancesProps, isSocketRequired: boolean, isProtocolRequired: boolean) {
    super(ManagedInstancesDefaultEnvVars);

    this.addAll(props.environmentVariables);

    this.add("DD_INSTALL_INFO_TOOL", "cdk");
    this.add("DD_INSTALL_INFO_TOOL_VERSION", "datadog-cdk-constructs");
    this.add("DD_INSTALL_INFO_INSTALLER_VERSION", versionJson.version);

    this.add("DD_API_KEY", props.apiKey);
    this.add("DD_SITE", props.site);
    this.add("DD_ENV", props.env);
    this.add("DD_SERVICE", props.service);
    this.add("DD_VERSION", props.version);
    this.add("DD_CHECKS_TAG_CARDINALITY", props.checksCardinality);
    this.add("DD_CRI_SOCKET_PATH", props.criSocketPath);
    if (props.globalTags && this.retrieve("DD_TAGS")) {
      log.debug(
        "Global tags (DD_TAGS) are set in both the environment variable" +
          "and the props. The environment variable will be overwritten.",
      );
    }
    this.add("DD_TAGS", props.globalTags);

    if (props.dogstatsd!.isEnabled && props.dogstatsd!.isOriginDetectionEnabled) {
      this.add("DD_DOGSTATSD_ORIGIN_DETECTION", "true");
      this.add("DD_DOGSTATSD_ORIGIN_DETECTION_CLIENT", "true");
    }
    this.add("DD_DOGSTATSD_TAG_CARDINALITY", props.dogstatsd!.dogstatsdCardinality);

    if (props.apm!.isEnabled) {
      this.add("DD_APM_ENABLED", "true");
    }

    this.add("DD_ECS_TASK_COLLECTION_ENABLED", props.orchestratorExplorer!.isEnabled ? "true" : "false");
    if (props.orchestratorExplorer!.url !== undefined) {
      this.add("DD_ORCHESTRATOR_EXPLORER_ORCHESTRATOR_DD_URL", props.orchestratorExplorer!.url);
    }

    if (props.processCollection!.isEnabled) {
      this.add("DD_PROCESS_CONFIG_PROCESS_COLLECTION_ENABLED", "true");
    }

    if (props.networkMonitoring!.isEnabled) {
      this.add("DD_SYSTEM_PROBE_NETWORK_ENABLED", "true");
    }

    // TCP fallback: daemons on an instance share a single network namespace
    // (the "daemon bridge"), reachable via a static IP. Non-local traffic
    // must be allowed for TCP-based DogStatsD/APM communication.
    if (isProtocolRequired) {
      this.add("DD_AGENT_HOST", DaemonBridgeIpv4);
      if (props.dogstatsd!.isEnabled && !props.dogstatsd!.isSocketEnabled) {
        this.add("DD_DOGSTATSD_NON_LOCAL_TRAFFIC", "true");
      }
      if (props.apm!.isEnabled && !props.apm!.isSocketEnabled) {
        this.add("DD_APM_NON_LOCAL_TRAFFIC", "true");
      }
    }

    if (isSocketRequired) {
      if (props.dogstatsd!.isEnabled && props.dogstatsd!.isSocketEnabled) {
        this.add("DD_DOGSTATSD_URL", "unix:///var/run/datadog/dsd.socket");
      }
      if (props.apm!.isEnabled && props.apm!.isSocketEnabled) {
        this.add("DD_TRACE_AGENT_URL", "unix:///var/run/datadog/apm.socket");
      }
    }
  }
}
