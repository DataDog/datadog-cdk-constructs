/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import { Construct } from "constructs";
import { DatadogStepFunctionsProps } from "./index";

export class DatadogStepFunctions extends Construct {
  scope: Construct;
  props: DatadogStepFunctionsProps;
  constructor(scope: Construct, id: string, props: DatadogStepFunctionsProps) {
    super(scope, id);
    this.scope = scope;
    this.props = props;
  }

  public addStateMachines(_stateMachines: sfn.StateMachine[], _construct?: Construct): void {}
}
