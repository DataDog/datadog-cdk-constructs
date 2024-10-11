#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkTypeScriptStack } from "../lib/cdk-typescript-stack";
import { CdkTypeScriptLambdaOldApiStack } from "../lib/cdk-typescript-lambda-old-api-stack";

const app = new cdk.App();
new CdkTypeScriptStack(app, "CdkTypeScriptStack", {});
new CdkTypeScriptLambdaOldApiStack(app, "CdkTypeScriptLambdaOldApiStack", {});
app.synth();
