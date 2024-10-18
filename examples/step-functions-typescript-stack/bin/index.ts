#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkStepFunctionsTypeScriptStack } from "../lib/cdk-step-functions-typescript-stack";

const app = new cdk.App();
new CdkStepFunctionsTypeScriptStack(app, "CdkStepFunctionsTypeScriptStack", {});
app.synth();
