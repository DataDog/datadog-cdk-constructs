/* eslint @typescript-eslint/no-var-requires: "off" */
const { AwsCdkConstructLibrary, ProjectType, NodePackageManager } = require("projen");

const project = new AwsCdkConstructLibrary({
  name: "foobarAndrewTest1",
  description: "test",
  author: "test",
  authorOrganization: true,
  entrypoint: "lib/index.js",
  repositoryUrl: "https://github.com/zARODz11z/projen_jsii_test.git",

  projectType: ProjectType.LIB,
  packageManager: NodePackageManager.YARN,

  jsiiFqn: "projen.AwsCdkConstructLibrary",
  defaultReleaseBranch: "main",
  releaseEveryCommit: false,
  cdkDependenciesAsDeps: false,

  publishToPypi: {
    distName: "foobarAndrewTest1",
    module: "foobarAndrewTest1",
  },
  cdkVersion: "1.95.1",
  deps: ["loglevel"],
  bundledDeps: ["loglevel"],
  cdkDependencies: ["@aws-cdk/aws-lambda", "@aws-cdk/aws-logs", "@aws-cdk/aws-logs-destinations", "@aws-cdk/core"],
  devDeps: ["ts-node", "prettier", "eslint-config-prettier", "eslint-plugin-prettier"],
  gitignore: [
    "*.js",
    "!jest.config.js",
    "!src/sample",
    "*.d.ts",
    ".cdk.staging",
    "cdk.out/",
    ".parcel-cache",
    "test/__snapshots__",
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
eslintConfig.addDeletionOverride("rules.quotes");
/*
TODO: tasks.json & package.json DeletionOverrides can be simplified to 5
      project.removeScript("<scriptName>") calls once https://github.com/projen/projen/issues/631 is fixed.
*/
const projenTasks = project.tryFindObjectFile(".projen/tasks.json");
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
