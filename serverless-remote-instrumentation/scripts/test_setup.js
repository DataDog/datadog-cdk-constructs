const { execSync } = require("child_process");
const { existsSync, readFileSync, writeFileSync } = require("fs");
const { yamlParse } = require("yaml-cfn");

const generateTestConfig = () => {
  process.env.SCRIPTS_PATH = process.env.SCRIPTS_PATH || "./scripts";
  process.env.CI_PROJECT_DIR = process.env.CI_PROJECT_DIR || ".";

  const configPath = "integration-tests/config.json";
  const template = yamlParse(
    readFileSync("template.yaml", { encoding: "utf8", flag: "r" }),
  );
  const version = template.Mappings.Constants.DdRemoteInstrumentApp.Version;
  let config;

  if (existsSync(configPath)) {
    config = JSON.parse(
      readFileSync(configPath, { encoding: "utf8", flag: "r" }).trim(),
    );
    if (config.version !== version) {
      config.version = version;
      writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
  } else {
    let namingSeed = "";
    let region = "eu-north-1";

    if (process.env.USER) {
      namingSeed = process.env.USER;
    }

    if (process.env.GITLAB_CI) {
      if (process.env.SELF_MONITORING === "true") {
        namingSeed = "self-monitoring";
        region = "ap-south-1";
      } else {
        namingSeed = process.env.CI_COMMIT_REF_NAME;
        region = "eu-south-1";
      }
    }
    // Remove any non alphanumeric characters to fit stack name constraints
    namingSeed = namingSeed.replace(/[\W_]+/g, "");

    config = {
      region,
      account: "425362996713",
      stackName: `RemoteInstrumenterTestStack${namingSeed}`,
      testLambdaRole: `test-lambda-execution-${region}-${namingSeed}`,
      functionName: `remote-instrumenter-testing-${namingSeed}`,
      bucketName: `remote-instrumenter-testing-bucket-${region}-${namingSeed}`,
      roleName: `remote-instrumenter-testing-${region}-${namingSeed}`,
      trailName: `datadog-serverless-instrumentation-trail-testing-${namingSeed}`,
      namingSeed,
      ddSite: "datad0g.com",
      version,
    };

    // There is a 64 character limit for a lot of resources
    Object.entries(config).forEach(
      ([key, val]) => (config[key] = val.slice(0, 63).toLowerCase()),
    );

    config = {
      ...config,
      apiSecretName: "Remote_Instrumenter_Test_API_Key_20250226",
      appSecretName: "Remote_Instrumenter_Test_APPLICATION_Key",
    };

    writeFileSync(configPath, JSON.stringify(config, null, 2));
  }
  return config;
};

exports.generateTestConfig = generateTestConfig;

if (require.main === module) {
  const config = generateTestConfig();

  console.log(`Using config\n${JSON.stringify(config)}`);

  const { region, stackName } = config;

  execSync(`APPROVE=y REGION=${region} ${process.env.SCRIPTS_PATH}/publish_sandbox.sh`, {
    encoding: "utf-8",
    stdio: "inherit",
  });

  // Need to yarn install since the publish script removes node modules
  execSync(`yarn install`, {
    encoding: "utf-8",
    stdio: "inherit",
  });

  execSync("cdk synth", {
    encoding: "utf-8",
    stdio: "inherit",
  });

  const prefix = process.env.GITLAB_CI
    ? ""
    : "aws-vault exec sso-serverless-sandbox-account-admin -- ";

  execSync(`${prefix}cdk deploy --require-approval never ${stackName}`, {
    encoding: "utf-8",
    stdio: "inherit",
  });
}
