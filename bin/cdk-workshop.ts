#!/usr/bin/env node
import * as cdk from '@aws-cdk/core';
import { CdkWorkshopStack } from '../lib/user-stack';

const app = new cdk.App();
new CdkWorkshopStack(app, 'CdkWorkshopStack');
