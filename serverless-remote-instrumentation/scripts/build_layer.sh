#!/bin/bash

# Unless explicitly stated otherwise all files in this repository are licensed
# under the Apache License Version 2.0.
# This product includes software developed at Datadog (https://www.datadoghq.com/).
# Copyright 2024 Datadog, Inc.

# This script is only tested on MacBook Pro M1

rm -rf node_modules
rm -rf scripts/.layers
yarn install --production
mkdir -p scripts/.layers

if [ ! -d "node_modules" ]; then
  yarn workspaces focus --production
  if [ ! -d "node_modules" ]; then
    echo "Failed to install node modules"
    exit 1
  fi
fi

# nodejs is the designated directory specified in Lambda documentation
mkdir -p nodejs
cp -r node_modules nodejs/
mkdir -p nodejs/node_modules/datadog-remote-instrument

# put src/* into node_modules/package-name/ as a package without copy src directory itself
cp -a src/. nodejs/node_modules/datadog-remote-instrument/
zip -r -q scripts/.layers/datadog_serverless_remote_instrumentation_arm64.zip nodejs
rm -rf nodejs
