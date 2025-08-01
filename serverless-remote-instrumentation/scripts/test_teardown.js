const { generateTestConfig } = require("./test_setup");
const { execSync } = require("child_process");

const { stackName } = generateTestConfig();

if (require.main === module) {
  execSync("cdk synth", {
    encoding: "utf-8",
    stdio: "inherit",
  });

  const prefix = process.env.GITLAB_CI
    ? ""
    : "aws-vault exec sso-serverless-sandbox-account-admin -- ";

  execSync(`${prefix}cdk destroy --force ${stackName}`, {
    encoding: "utf-8",
    stdio: "inherit",
  });
}