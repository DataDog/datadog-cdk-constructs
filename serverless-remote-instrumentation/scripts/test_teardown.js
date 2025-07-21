const { generateTestConfig } = require("./test_setup");
const { execSync } = require("child_process");

const { bucketName, region, stackName } = generateTestConfig();

if (require.main === module) {
  execSync("cdk synth", {
    encoding: "utf-8",
    stdio: "inherit",
  });

  const prefix = process.env.GITLAB_CI
    ? ""
    : "aws-vault exec sso-serverless-sandbox-account-admin -- ";

  // This will fail because the bucket will have contents, but start the deletion
  // so that more things don't end up in the bucket while we try to delete
  try {
    execSync(`${prefix}cdk destroy --force ${stackName}`, {
      encoding: "utf-8",
      stdio: "inherit",
    });
  } catch (e) {
    // Ignore
  }

  // Force the bucket to be deleted, this can fail if the bucket doesn't exist
  // like if we ran the teardown script twice, so ignore errors from it
  try {
    execSync(
      `${prefix}aws s3 rb s3://${bucketName} --force --region ${region}`,
      {
        encoding: "utf-8",
        stdio: "inherit",
      },
    );
  } catch (e) {
    // Ignore
  }

  // Now that the bucket is gone, delete the rest of the stack
  execSync(`${prefix}cdk destroy --force ${stackName}`, {
    encoding: "utf-8",
    stdio: "inherit",
  });
}