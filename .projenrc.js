/* eslint @typescript-eslint/no-var-requires: "off" */
const { awscdk, javascript, github, JsonPatch } = require("projen");

const project = new awscdk.AwsCdkConstructLibrary({
  name: "datadog-cdk-constructs-v2",
  description:
    "CDK Construct Library to automatically instrument Python and Node Lambda functions with Datadog using AWS CDK v2",
  author: "Datadog",
  authorOrganization: true,
  entrypoint: "lib/index.js",
  repositoryUrl: "https://github.com/DataDog/datadog-cdk-constructs",

  packageManager: javascript.NodePackageManager.YARN_CLASSIC,
  minNodeVersion: "18.18.0",

  jsiiFqn: "projen.AwsCdkConstructLibrary",
  defaultReleaseBranch: "main",
  releaseEveryCommit: false,
  publishToPypi: {
    distName: "datadog-cdk-constructs-v2",
    module: "datadog_cdk_constructs_v2",
  },
  publishToGo: {
    moduleName: "github.com/DataDog/datadog-cdk-constructs-go",
    packageName: "ddcdkconstruct",
  },
  peerDeps: [],
  cdkVersion: "2.205.0",
  cdkCliVersion: "^2.205.0",
  deps: ["loglevel"],
  bundledDeps: ["loglevel"],
  devDeps: [
    "ts-node",
    "prettier",
    "eslint-config-prettier",
    "eslint-plugin-prettier",
    "esbuild",
    "standard-version",
    "@aws-cdk/aws-lambda-python-alpha@^2.134.0-alpha.0",
  ],
  gitignore: [
    "*.js",
    "!jest.config.js",
    "!src/sample",
    "!src/sample/lambda_nodejs/hello_node.js",
    "!scripts/fix-version.js",
    "!scripts/upgrade-cdk.js",
    "*.d.ts",
    ".cdk.staging",
    "cdk.out/",
    ".parcel-cache",
    "test/__snapshots__",
    ".DS_Store",
    "integration_tests/cdk.out",
    "integration_tests/testlib",
    "bin",
    "obj",
    "__pycache__",
  ],
  npmignore: [
    "!LICENSE",
    "!LICENSE-3rdparty.csv",
    "!NOTICE",
    "/scripts",
    "/integration_tests",
    ".prettierrc",
    "cdk.out/*",
    "yarn-error.log",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "/examples",
  ],
  scripts: {
    "check-formatting": "prettier --check src/** integration_tests/**/*.ts examples/**/*.ts",
  },
  pullRequestTemplate: false,
  dependabot: false,
  buildWorkflow: false,
  releaseWorkflow: false,
  rebuildBot: false,
  mergify: false,
  licensed: true,
  docgen: false,
  depsUpgradeOptions: {
    workflowOptions: {
      schedule: javascript.UpgradeDependenciesSchedule.WEEKLY,
      projenCredentials: github.GithubCredentials.fromApp({
        appIdSecret: "GH_APP_ID",
        privateKeySecret: "GH_APP_PRIVATE_KEY",
      }),
      gitIdentity: {
        name: "github-actions-upgrade",
        email: "github-actions-upgrade@github.com",
      },
    },
  },
});

// Use a protected environment for the upgrade workflow to access the environment secrets
project.github?.tryFindWorkflow("upgrade")?.file?.patch(
  JsonPatch.add("/jobs/pr/environment", {
    name: "protected-main-env",
  }),
);

// Patch the upgrade workflow since its managed by projen
// to add a step to upgrade the CDK versions.  3 happens to
// be the index after install dependencies and before the
// other dependency upgrade step.
project.github?.tryFindWorkflow("upgrade")?.file?.patch(
  JsonPatch.add("/jobs/upgrade/steps/3", {
    name: "Upgrade CDK versions",
    run: "node scripts/upgrade-cdk.js",
  }),
);

const eslintConfig = project.tryFindObjectFile(".eslintrc.json");
eslintConfig.addOverride("extends", [
  "plugin:@typescript-eslint/recommended",
  "prettier",
  "plugin:prettier/recommended",
]);

eslintConfig.addOverride("rules", {
  "@typescript-eslint/switch-exhaustiveness-check": "error",
  "@typescript-eslint/no-require-imports": "off",
  "@typescript-eslint/no-var-requires": "off",
  "@typescript-eslint/no-explicit-any": "off",
  "@typescript-eslint/no-empty-interface": "off",
  "@typescript-eslint/explicit-module-boundary-types": "off",
  "@typescript-eslint/no-unused-vars": "off",
  "@typescript-eslint/explicit-function-return-type": "off",
  "no-console": "off",
  "no-empty": "off",
  "@stylistic/quotes": "off",
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

// Collapse the generated Go package on GitHub
project.gitattributes.addAttributes("/dist/go/** linguist-generated");

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
    exec: "node ./scripts/fix-version.js",
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
    exec: "ls -a && pwd",
  },
  {
    exec: "echo $CI_PROJECT_DIR",
  },
  {
    exec: "echo $CI_CONFIG_PATH",
  },
  {
    exec: "echo $CI_PROJECT_PATH",
  },
  {
    exec: "ls -a /etc",
  },
  {
    exec: "ls -a $CI_CONFIG_PATH",
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
