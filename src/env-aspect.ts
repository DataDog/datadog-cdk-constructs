/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { IAspect } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { IConstruct } from "constructs";
import log from "loglevel";
import { applyEnvVariables, applySourceCodeIntegration, readResolvedFunctionEnv } from "./env";
import { DatadogLambdaStrictProps } from "./interfaces";

/** @internal */
export interface DatadogLambdaEnvAspectOptions {
  /** The functions this aspect should instrument. Other functions in the tree are ignored. */
  readonly targets: Set<lambda.Function>;
  readonly baseProps: DatadogLambdaStrictProps;
  readonly sourceCodeIntegration: boolean;
  /** Read lazily at synth time so values set via overrideGitMetadata after registration apply. */
  readonly getGitCommitShaOverride: () => string | undefined;
  readonly getGitRepoUrlOverride: () => string | undefined;
}

/**
 * CDK Aspect that applies Datadog environment variables to instrumented Lambda functions at
 * synth time rather than eagerly during `addLambdaFunctions`.
 *
 * Why an Aspect: aws-cdk-lib exposes no public API to read a function's env vars eagerly, and
 * reaching into the private `Function.environment` field is what broke `cdk synth` across a
 * routine aws-cdk-lib minor. Aspects run during synthesis, after all user `addEnvironment`
 * calls -- whether made before or after `addLambdaFunctions` -- have executed. At that point we
 * read the function's resolved env vars through the public token-resolution API and only fill
 * in Datadog defaults the user has not already set. This preserves user-set values regardless
 * of ordering, with no dependency on aws-cdk-lib internals.
 */
/** @internal */
export class DatadogLambdaEnvAspect implements IAspect {
  constructor(private readonly options: DatadogLambdaEnvAspectOptions) {}

  public visit(node: IConstruct): void {
    if (!(node instanceof lambda.Function)) {
      return;
    }
    if (!this.options.targets.has(node)) {
      return;
    }

    log.debug(`Applying Datadog env vars to ${node.node.path} at synth time`);
    const existingEnv = readResolvedFunctionEnv(node);

    applyEnvVariables(node, this.options.baseProps, existingEnv);

    if (this.options.sourceCodeIntegration) {
      applySourceCodeIntegration(
        node,
        existingEnv,
        this.options.getGitCommitShaOverride(),
        this.options.getGitRepoUrlOverride(),
      );
    }
  }
}
