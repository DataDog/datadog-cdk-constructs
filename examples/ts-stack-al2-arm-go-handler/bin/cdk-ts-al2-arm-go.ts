#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { CdkTsAl2ArmGoStack } from "../lib/cdk-ts-al2-arm-go-stack";

const app = new cdk.App();
new CdkTsAl2ArmGoStack(app, "CdkTsAl2ArmGoHandlerStack", {});
