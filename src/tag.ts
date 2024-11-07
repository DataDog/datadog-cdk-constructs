/*
 * Unless explicitly stated otherwise all files in this repository are licensed
 * under the Apache License Version 2.0.
 *
 * This product includes software developed at Datadog (https://www.datadoghq.com/).
 * Copyright 2021 Datadog, Inc.
 */

import { Tags } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import log from "loglevel";
import { TagKeys, DatadogLambdaProps } from "./index";

export function setTags(resource: lambda.Function, props: DatadogLambdaProps): void {
  log.debug(`Adding datadog tags`);
  if (props.env) {
    Tags.of(resource).add(TagKeys.ENV, props.env);
  }
  if (props.service) {
    Tags.of(resource).add(TagKeys.SERVICE, props.service);
  }
  if (props.version) {
    Tags.of(resource).add(TagKeys.VERSION, props.version);
  }
  if (props.tags) {
    const tagsArray = props.tags.split(",");
    tagsArray.forEach((tag: string) => {
      const [key, value] = tag.split(":");
      if (key && value) {
        Tags.of(resource).add(key, value);
      }
    });
  }
}
