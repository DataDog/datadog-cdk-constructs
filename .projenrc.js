const { AwsCdkConstructLibrary } = require('projen');

const project = new AwsCdkConstructLibrary({
  name: 'datadog-cdk-constructs',
  description: 'CDK Construct library to automatically instrument python and node functions with datadog tracing',
  author: 'Datadog',
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.AwsCdkConstructLibrary',
  entrypoint: 'lib/index.js',
  repositoryUrl: 'git@github.com:DataDog/datadog-cdk-constructs.git',

  cdkVersion: '1.71.0',
  devDeps: [
    '@aws-cdk/assert',
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-logs',
    '@aws-cdk/aws-logs-destinations',
    '@aws-cdk/core',
    '@types/jest',
    '@types/node',
    '@typescript-eslint/eslint-plugin',
    '@typescript-eslint/parser',
    'aws-cdk',
    'jest',
    'prettier',
    'ts-jest',
    'ts-node',
    'typescript',
  ],
  peerDeps: [
    '@aws-cdk/aws-lambda',
    '@aws-cdk/aws-logs',
    '@aws-cdk/core',
    '@aws-cdk/aws-logs-destinations',
  ],

});

project.synth();
