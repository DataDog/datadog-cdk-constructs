/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { Token, Stack } from "aws-cdk-lib";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import log from "loglevel";
import { addForwarderForStateMachine } from "./forwarder";
import { DatadogStepFunctionsProps } from "./index";
import { buildStepFunctionLambdaTaskPayloadToMergeTraces } from "./span-link";
import { setTags } from "./tag";

const unsupportedCaseErrorMessage =
  "Step Function Instrumentation is not supported. \
Please open a feature request in https://github.com/DataDog/datadog-cdk-constructs.";

export class DatadogStepFunctions extends Construct {
  public static buildLambdaPayloadToMergeTraces(payload: { [key: string]: any } = {}): { [key: string]: any } {
    return buildStepFunctionLambdaTaskPayloadToMergeTraces(payload);
  }

  scope: Construct;
  props: DatadogStepFunctionsProps;
  stack: Stack;

  constructor(scope: Construct, id: string, props: DatadogStepFunctionsProps) {
    super(scope, id);
    this.scope = scope;
    this.props = props;
    this.stack = Stack.of(this);
  }

  public addStateMachines(stateMachines: sfn.StateMachine[], construct?: Construct): void {
    for (const stateMachine of stateMachines) {
      this.addStateMachine(stateMachine, construct);
    }
  }

  private addStateMachine(stateMachine: sfn.StateMachine, _construct?: Construct) {
    const logGroup = this.setUpLogging(stateMachine);

    if (this.props.forwarderArn !== undefined) {
      addForwarderForStateMachine(this, stateMachine, this.props.forwarderArn, logGroup);
    } else {
      log.debug("Forwarder ARN not provided, no log group subscriptions will be added");
    }

    setTags(stateMachine, this.props);
  }

  /**
   * Set up logging for the given state machine:
   * 1. Set log level to ALL
   * 2. Set includeExecutionData to true
   * 3. Set destination log group (if not set already)
   * 4. Add permissions to the state machine role to log to CloudWatch Logs
   *
   * Also extracts the log group if it exists.
   *
   * @returns the existing or newly created log group
   */
  private setUpLogging(stateMachine: sfn.StateMachine): logs.ILogGroup {
    const cfnStateMachine = stateMachine.node.defaultChild as sfn.CfnStateMachine;

    if (Token.isUnresolved(cfnStateMachine.loggingConfiguration)) {
      // loggingConfiguration is IResolvable, i.e. an unresolved token
      throw new Error(`loggingConfiguration is an an unresolved token. ${unsupportedCaseErrorMessage}`);
    }

    // Set log level and includeExecutionData
    cfnStateMachine.loggingConfiguration = {
      ...cfnStateMachine.loggingConfiguration,
      level: "ALL",
      includeExecutionData: true,
    };

    let logGroup: logs.ILogGroup;
    // Set destination log group if not set
    if (!cfnStateMachine.loggingConfiguration.destinations) {
      const logGroupName = buildLogGroupName(stateMachine, this.props.env);
      logGroup = new logs.LogGroup(stateMachine, "LogGroup", {
        retention: logs.RetentionDays.ONE_WEEK,
        logGroupName: logGroupName,
      });

      cfnStateMachine.loggingConfiguration = {
        ...cfnStateMachine.loggingConfiguration,
        destinations: [
          {
            cloudWatchLogsLogGroup: {
              logGroupArn: logGroup.logGroupArn,
            },
          } as sfn.CfnStateMachine.LogDestinationProperty,
        ],
      };
    } else {
      // Extract log group from logging config
      const destinations = cfnStateMachine.loggingConfiguration.destinations;
      if (!this.isLogDestinationPropertyArray(destinations)) {
        throw new Error(`destinations is not an array. ${unsupportedCaseErrorMessage}`);
      }

      const destination = destinations[0];
      if (!("cloudWatchLogsLogGroup" in destination)) {
        throw new Error(`cloudWatchLogsLogGroup is not in destination. ${unsupportedCaseErrorMessage}`);
      }

      const logGroupConfig = destination.cloudWatchLogsLogGroup;
      if (logGroupConfig === undefined) {
        throw new Error(`cloudWatchLogsLogGroup is undefined. ${unsupportedCaseErrorMessage}`);
      }

      if (!("logGroupArn" in logGroupConfig)) {
        throw new Error(`logGroupArn is not in cloudWatchLogsLogGroup. ${unsupportedCaseErrorMessage}`);
      }

      const logGroupArn = logGroupConfig.logGroupArn;
      if (logGroupArn === undefined) {
        throw new Error(`logGroupArn is undefined. ${unsupportedCaseErrorMessage}`);
      }

      logGroup = logs.LogGroup.fromLogGroupArn(this, "LogGroup", logGroupArn);
    }

    // Configure state machine role to have permission to log to CloudWatch Logs, following
    // https://docs.aws.amazon.com/step-functions/latest/dg/cw-logs.html#cloudwatch-iam-policy
    stateMachine.role.addToPrincipalPolicy(
      new iam.PolicyStatement({
        actions: [
          "logs:CreateLogDelivery",
          "logs:CreateLogStream",
          "logs:GetLogDelivery",
          "logs:UpdateLogDelivery",
          "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries",
          "logs:PutLogEvents",
          "logs:PutResourcePolicy",
          "logs:DescribeResourcePolicies",
          "logs:DescribeLogGroups",
        ],
        resources: ["*"],
      }),
    );

    return logGroup;
  }

  private isLogDestinationPropertyArray(
    destinations: any,
  ): destinations is sfn.CfnStateMachine.LogDestinationProperty[] {
    return (
      Array.isArray(destinations) &&
      destinations.every(
        (destination) =>
          typeof destination === "object" && destination !== null && "cloudWatchLogsLogGroup" in destination,
      )
    );
  }
}

/**
 * Builds log group name for a state machine using its CDK path.
 * The path is like "MyStack/MyStateMachine", which includes the stack name and the relative path of the state machine
 * in the stack. This guarantees no two state machines share the same log group name because:
 * 1. stack name is unique in a region in an AWS account
 * 2. relative path is unique in a stack
 * @returns log group name like "/aws/vendedlogs/states/MyCdkStack-MyStateMachine-Logs" (without env)
 *                           or "/aws/vendedlogs/states/MyCdkStack-MyStateMachine-Logs-dev" (with env)
 */
export const buildLogGroupName = (stateMachine: sfn.StateMachine, env: string | undefined): string => {
  // Replace / with - in the state machine path to avoid potential parsing issues in other systems such as forwarder
  const path = stateMachine.node.path.replace(/\//g, "-");
  return `/aws/vendedlogs/states/${path}-Logs${env !== undefined ? "-" + env : ""}`;
};
