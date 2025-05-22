import { Secret } from "aws-cdk-lib/aws-ecs";
import { EnvVarManager } from "../environment";
import { DatadogECSFargateProps } from "./interfaces";

/**
 * Internal props for the Datadog ECS Fargate construct.
 */
export interface DatadogECSFargateInternalProps extends DatadogECSFargateProps {
  readonly envVarManager: EnvVarManager;
  readonly isLinux: boolean;
  readonly isSocketRequired: boolean;
  readonly isProtocolRequired: boolean;
  readonly datadogSecret?: Secret;
}
