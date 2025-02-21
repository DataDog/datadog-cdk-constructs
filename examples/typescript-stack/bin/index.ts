#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CdkTypeScriptStack } from "../lib/cdk-typescript-stack";

const app = new cdk.App();
new CdkTypeScriptStack(app, "CdkTypeScriptStack", {});
app.synth();
