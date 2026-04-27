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

  packageManager: javascript.NodePackageManager.YARN_BERRY,
  yarnBerryOptions: {
    version: "4.12.0",
    yarnRcOptions: {
      nodeLinker: javascript.YarnNodeLinker.NODE_MODULES,
    },
  },
  minNodeVersion: "20.16.0",

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
  publishToMaven: {
    javaPackage: "com.datadoghq.cdkconstructs",
    mavenGroupId: "com.datadoghq",
    mavenArtifactId: "datadog-cdk-constructs",
  },
  peerDeps: [],
  cdkVersion: "2.245.0",
  cdkCliVersion: "^2.245.0",
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
    "*.tar.gz",
    "cdk.context.json",
  ],
  npmignore: [
    "!LICENSE",
    "!LICENSE-3rdparty.csv",
    "!NOTICE",
    "/scripts",
    "/integration_tests",
    ".prettierrc",
    "/.ncurc.cjs",
    "cdk.out/*",
    "yarn-error.log",
    "CHANGELOG.md",
    "CONTRIBUTING.md",
    "/examples",
  ],
  scripts: {
    "check-formatting": "prettier --check src/**/*.ts integration_tests/**/*.ts examples/**/*.ts",
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

// Pin GitHub Actions to commit SHAs instead of tags
project.github.actions.set(
  "actions/checkout",
  "actions/checkout@93cb6efe18208431cddfb8368fd83d5badbf9bfd", // v5
);
project.github.actions.set(
  "actions/setup-node",
  "actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444", // v5
);
project.github.actions.set(
  "actions/upload-artifact",
  "actions/upload-artifact@ea165f8d65b6e75b540449e92b4886f43607fa02", // v4.6.2
);
project.github.actions.set(
  "actions/download-artifact",
  "actions/download-artifact@634f93cb2916e3fdff6788551b99b062d0335ce0", // v5
);
project.github.actions.set(
  "peter-evans/create-pull-request",
  "peter-evans/create-pull-request@22a9089034f40e5a961c8808d113e2c98fb63676", // v7
);
project.github.actions.set(
  "amannn/action-semantic-pull-request",
  "amannn/action-semantic-pull-request@48f256284bd46cdaab1048c3721360e808335d50", // v6
);

// Use a protected environment for the upgrade workflow to access the environment secrets
project.github?.tryFindWorkflow("upgrade")?.file?.patch(
  JsonPatch.add("/jobs/pr/environment", {
    name: "protected-main-env",
  }),
);

// Patch the upgrade workflow to enable Corepack before setup-node, so that
// setup-node can detect the yarn berry package manager (from the packageManager
// field in package.json) and set up caching correctly.
project.github?.tryFindWorkflow("upgrade")?.file?.patch(
  JsonPatch.add("/jobs/upgrade/steps/1", {
    name: "Enable Corepack",
    run: "corepack enable",
  }),
);

// Patch the upgrade workflow since its managed by projen
// to add a step to upgrade the CDK versions.  4 happens to
// be the index after install dependencies and before the
// other dependency upgrade step (shifted by 1 due to the
// Enable Corepack step inserted above).
project.github?.tryFindWorkflow("upgrade")?.file?.patch(
  JsonPatch.add("/jobs/upgrade/steps/4", {
    name: "Upgrade CDK versions",
    run: "node scripts/upgrade-cdk.js",
  }),
);

// The projen upgrade task sets CI=0 to allow the lockfile to be updated, but
// Yarn 4.x treats any non-empty CI string as truthy and keeps immutable installs
// active. Override via the YARN_ENABLE_IMMUTABLE_INSTALLS env var instead, scoped
// only to the upgrade step so the setting never leaks into normal installs.
project.github?.tryFindWorkflow("upgrade")?.file?.patch(
  JsonPatch.add("/jobs/upgrade/steps/5/env", {
    YARN_ENABLE_IMMUTABLE_INSTALLS: "false",
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
    exec: "jest --runInBand --verbose --passWithNoTests --all",
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
project.addTask("create-release", {
  exec: "bash scripts/create_release.sh",
  receiveArgs: true,
});

// npmMinimalAgeGate is not in projen's typed YarnrcOptions, so we add it via override
const yarnrc = project.tryFindObjectFile(".yarnrc.yml");
yarnrc.addOverride("npmMinimalAgeGate", "2d");

project.synth();
