const { AwsCdkConstructLibrary } = require("projen");

const project = new AwsCdkConstructLibrary({
  author: "Datadog",
  authorAddress: "anthony.lam@datadoghq.com",
  cdkVersion: "1.71.0",
  jsiiFqn: "projen.AwsCdkConstructLibrary",
  name: "datadog-cdk-constructs",
  repositoryUrl: "git@github.com:DataDog/datadog-cdk-constructs.git",
  cdkDependencies: [
    "@aws-cdk/aws-lambda",
    "@aws-cdk/core",
    "@aws-cdk/aws-logs",
    "@aws-cdk/aws-logs-destinations",
  ],
  bundledDeps: [
    'crypto'
  ],
  cdkAssert: true,
  devDeps: [
    "@aws-cdk/assert",
    "@types/jest",
    "@types/node",
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "aws-cdk",
    "eslint",
    "jest",
    "prettier",
    "ts-jest",
    "ts-node",
    "tslint",
    "typescript",
  ],
  deps: [
    'crypto'
  ],

  // python: {
  //   module: "datadog-cdk-construct",
  //   distName: "datadog-cdk-construct"
  // }
});

const exclusions = ['cdk.out'];
project.npmignore.exclude(...exclusions);
project.gitignore.exclude(...exclusions);

project.synth();
