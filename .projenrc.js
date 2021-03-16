const { AwsCdkConstructLibrary, ProjectType, NodePackageManager, github } = require("projen");

const project = new AwsCdkConstructLibrary({
  name: "datadog-cdk-constructs",
  description: "CDK Construct library to automatically instrument python and node functions with datadog tracing",
  author: "Datadog",
  authorOrganization: true,
  entrypoint: "lib/index.js",
  repositoryUrl: "git@github.com:DataDog/datadog-cdk-constructs.git",

  projectType: ProjectType.LIB,
  packageManager: NodePackageManager.YARN,

  jsiiFqn: "projen.AwsCdkConstructLibrary",
  defaultReleaseBranch: "main",
  releaseEveryCommit: false,
  cdkDependenciesAsDeps: false,
  cdkVersion: "1.71.0",

  cdkDependencies: ["@aws-cdk/aws-lambda", "@aws-cdk/aws-logs", "@aws-cdk/aws-logs-destinations", "@aws-cdk/core"],
  devDeps: ["ts-node", "aws-cdk", "eslint-config-prettier", "eslint-plugin-prettier", "prettier"],
  gitignore: [
    "*.js",
    "!jest.config.js",
    "!src/sample",
    "*.d.ts",
    ".cdk.staging",
    "cdk.out/",
    ".parcel-cache",
    "test/__snapshots__",
    'default.integration.snapshot.spec.ts'
  ],
  npmignore: ["!LICENSE", "!LICENSE-3rdparty.csv", "!NOTICE", "/scripts"],
  jestOptions: {
    jestConfig: {
      roots: ["<rootDir>/test"],
      transform: {
        "^.+\\.tsx?$": "ts-jest",
      },
      moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    },
  },
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
eslintConfig.addOverride("plugins", ["@typescript-eslint", "import", "prettier"]);
eslintConfig.addOverride("extends", ["plugin:import/typescript", "prettier"]);
eslintConfig.addOverride("rules", {
  "prettier/prettier": [
    "error",
    {
      trailingComma: "all",
      printWidth: 120,
      arrowParens: "always",
    },
  ],
});
eslintConfig.addDeletionOverride("rules.quotes");

project.synth();
