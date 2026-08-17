# Lambda E2E tests

The suite runs the `DatadogLambda` construct against a temporary AWS Lambda function:

1. Deploy the uninstrumented function.
2. Apply the construct and verify its layers, handler, runtime, environment, and tags.
3. Invoke the function and wait for matching spans and logs in Datadog.
4. Confirm `cdk diff --fail` reports no changes.
5. Destroy the stack and verify the function is gone.

Layer and runtime versions are pinned in [`helpers/versions.ts`](helpers/versions.ts).

## Run locally

You need Node 22+, Yarn, AWS credentials for a CDK-bootstrapped account, and Datadog API and application keys for the serverless org.

```bash
aws-vault exec sso-serverless-sandbox-account-admin -- \
  dd-auth --domain ddserverless.datadoghq.com -- bash -c '
    export DATADOG_API_KEY="$DD_API_KEY" DATADOG_APP_KEY="$DD_APP_KEY"
    yarn test:e2e
  '
```

The suite defaults to `ap-northeast-3` and `datadoghq.com`. Set `AWS_REGION` or `DD_SITE` to override them.

## CI

[The E2E workflow](../.github/workflows/e2e.yml) runs when the construct or suite changes. It assumes the repository's AWS role through GitHub OIDC and obtains short-lived Datadog keys through `dd-sts`; missing credentials fail the run.

The workflow uses `AWS_ROLE_ARN_E2E`, `AWS_REGION_E2E`, and `DD_SITE_E2E` repository variables. The AWS account must be CDK-bootstrapped.

## Resource cleanup

Each run uses a unique `one-e2e-cdk-lambda-<runid>` name and stamps its run ID and creation time on the function. The test always attempts `cdk destroy`; the cross-repository sweeper removes resources left by interrupted runs.
