/* eslint @typescript-eslint/no-var-requires: "off" */
const { awscdk, javascript } = require("projen");

const project = new awscdk.AwsCdkConstructLibrary({
  name: "datadog-cdk-constructs-v2",
  description:
    "CDK Construct Library to automatically instrument Python and Node Lambda functions with Datadog using AWS CDK v2",
  author: "Datadog",
  authorOrganization: true,
  entrypoint: "lib/index.js",
  repositoryUrl: "https://github.com/DataDog/datadog-cdk-constructs",

  packageManager: javascript.NodePackageManager.YARN,
  minNodeVersion: "14.15.0",

  jsiiFqn: "projen.AwsCdkConstructLibrary",
  defaultReleaseBranch: "main",
  releaseEveryCommit: false,
  publishToPypi: {
    distName: "datadog-cdk-constructs-v2",
    module: "datadog_cdk_constructs_v2",
  },
  cdkVersion: "2.0.0",
  peerDeps: ["@aws-cdk/aws-lambda-python-alpha@^2.0.0-alpha.1"],
  deps: ["loglevel"],
  bundledDeps: ["loglevel"],
  devDeps: ["ts-node", "prettier", "eslint-config-prettier", "eslint-plugin-prettier", "standard-version"],
  gitignore: [
    "*.js",
    "!jest.config.js",
    "!src/sample",
    "*.d.ts",
    ".cdk.staging",
    "cdk.out/",
    ".parcel-cache",
    "test/__snapshots__",
    ".DS_Store",
    "integration_tests/cdk.out",
    "integration_tests/testlib",
  ],
  npmignore: [
    "!LICENSE",
    "!LICENSE-3rdparty.csv",
    "!NOTICE",
    "/scripts",
    ".prettierrc",
    "cdk.out/*",
    "yarn-error.log",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
  ],
  scripts: {
    "check-formatting": "prettier --check src/**",
  },
  pullRequestTemplate: false,
  dependabot: false,
  buildWorkflow: false,
  releaseWorkflow: false,
  rebuildBot: false,
  mergify: false,
  licensed: true,
  docgen: false,
});
const eslintConfig = project.tryFindObjectFile(".eslintrc.json");
eslintConfig.addOverride("extends", [
  "plugin:@typescript-eslint/recommended",
  "prettier",
  "plugin:prettier/recommended",
]);

eslintConfig.addOverride("rules", {
  "@typescript-eslint/no-require-imports": "off",
  "@typescript-eslint/no-var-requires": "off",
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-empty-interface": "off",
  "@typescript-eslint/explicit-module-boundary-types": "off",
  "@typescript-eslint/no-unused-vars": "off",
  "@typescript-eslint/explicit-function-return-type": "off",
  "no-console": "off",
  "no-empty": "off",
  "comma-dangle": [
    "error",
    {
      imports: "ignore",
      exports: "ignore",
      arrays: "always-multiline",
      functions: "always-multiline",
      objects: "always-multiline",
    },
  ],
});

project.addGitIgnore("!integration_tests/tsconfig.json");

eslintConfig.addDeletionOverride("rules.quotes");
/*
TODO: tasks.json & package.json DeletionOverrides can be simplified to 5
      project.removeScript("<scriptName>") calls once https://github.com/projen/projen/issues/631 is fixed.
*/
const projenTasks = project.tryFindObjectFile(".projen/tasks.json");
projenTasks.addOverride("tasks.build.steps", [
  {
    spawn: "default",
  },
  {
    spawn: "test",
  },
  {
    spawn: "pre-compile",
  },
  {
    spawn: "compile",
  },
  {
    spawn: "post-compile",
  },
  {
    spawn: "package-all",
  },
]);
projenTasks.addOverride("tasks.pre-compile.steps", [
  {
    exec: "node ./src/common/scripts/fix-version.js v2",
  },
]);
projenTasks.addDeletionOverride("tasks.clobber");
projenTasks.addDeletionOverride("tasks.test:update");
projenTasks.addDeletionOverride("tasks.release");
projenTasks.addDeletionOverride("tasks.bump");
projenTasks.addDeletionOverride("tasks.compat");
projenTasks.addDeletionOverride("tasks.test:compile");
projenTasks.addOverride("tasks.test.steps", [
  {
    exec: "rm -fr lib/",
  },
  {
    exec: "jest --passWithNoTests --all",
  },
  {
    spawn: "eslint",
  },
]);
const npmScripts = project.tryFindObjectFile("package.json");
npmScripts.addDeletionOverride("scripts.clobber");
npmScripts.addDeletionOverride("scripts.test:update");
npmScripts.addDeletionOverride("scripts.release");
npmScripts.addDeletionOverride("scripts.bump");
npmScripts.addDeletionOverride("scripts.compat");
projenTasks.addDeletionOverride("scripts.test:compile");

project.synth();
