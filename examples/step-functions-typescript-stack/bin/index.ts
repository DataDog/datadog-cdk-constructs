#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkStepFunctionsTypeScriptStack } from "../lib/cdk-step-functions-typescript-stack";

const app = new cdk.App();
// Ensure there's no identifier collision when a stack has multiple instances in the app
new CdkStepFunctionsTypeScriptStack(app, "CdkStepFunctionsTypeScriptStack1", {});
new CdkStepFunctionsTypeScriptStack(app, "CdkStepFunctionsTypeScriptStack2", {});
app.synth();
