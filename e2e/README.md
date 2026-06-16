# Lambda e2e suite

End-to-end test for the `DatadogLambda` construct against real AWS, conforming to the
serverless instrumentation e2e contract (`serverless-ci/e2e/spec.md`). It deploys an
uninstrumented Node.js Lambda, applies the construct, proves telemetry flows to
Datadog, asserts re-apply is idempotent, removes instrumentation, and verifies a clean
end-state -- tearing the function down regardless of outcome.

## What it does

The construct is the instrumentation mechanism, so APPLY and REMOVE are both
`cdk deploy` of the same stack (`app/app.ts`); only `E2E_INSTRUMENT` differs:

1. **Provision** -- deploy the workload uninstrumented (`E2E_INSTRUMENT=false`),
   uniquely named `one-e2e-cdk-lambda-<runid>` and freshness-tagged at creation.
2. **APPLY** -- deploy with `E2E_INSTRUMENT=true`; verify config: pinned Datadog Node
   + Extension layers, handler redirected to the Datadog wrapper, and the required
   `DD_*` env vars asserted by identity (`DD_SERVICE`, `DD_ENV`, `DD_VERSION`,
   `DD_SITE`, `DD_API_KEY`, `DD_TRACE_ENABLED`, `DD_LOGS_INJECTION`, run id in
   `DD_TAGS`).
3. **Trigger** -- `aws lambda invoke`, then poll Datadog spans + logs filtered by the
   run id and assert each carries the expected `service`/`env`/`version`/run id.
4. **Re-APPLY** -- `cdk diff --fail`; assert no diff (idempotent).
5. **REMOVE** -- deploy uninstrumented again; assert layers, all `DD_*` env vars, and
   the `dd_cdk_construct` tag are gone (the hygiene freshness tag intentionally
   survives so the sweeper can still reap the function).

Pinned artifact versions live in `helpers/versions.ts`; bump them deliberately so a
failure blames this construct's wiring, not an upstream layer/tracer change.

## Prerequisites

- **AWS auth** with permission to deploy Lambda + CloudFormation in a
  CDK-bootstrapped account/region. Locally:
  `aws-vault exec sso-serverless-sandbox-account-admin -- yarn test:e2e`.
  Bootstrap once per account/region if needed: `npx cdk bootstrap`.
- **Datadog keys** for the org telemetry lands in:
  - `DD_API_KEY` -- baked into the function (used by the construct + extension).
  - `DATADOG_API_KEY` / `DATADOG_APP_KEY` -- used by the telemetry checker to query
    spans and logs. (`DD_API_KEY` / `DD_APP_KEY` are accepted as fallbacks.)
- **`DD_SITE`** -- defaults to `datadoghq.com`; set to match the key's org.
- Node 22+ and `yarn install`.

## Run

```bash
# full lifecycle (real deploys + telemetry; ~10-15 min)
aws-vault exec sso-serverless-sandbox-account-admin -- \
  DD_API_KEY=... DATADOG_API_KEY=... DATADOG_APP_KEY=... yarn test:e2e

# skip (no-op) -- what forks/CI without secrets do
SKIP_LAMBDA_TESTS=true yarn test:e2e
```

## CI

`.github/workflows/e2e.yml` runs this behind path filters (construct or suite
changes) with `SKIP_LAMBDA_TESTS` as a kill switch. AWS access is via GitHub OIDC
(build-stable, chained into the serverless sandbox role); `DD_API_KEY` / `DD_APP_KEY`
come from repo secrets.

## Hygiene

Every resource is named `one-e2e-cdk-lambda-<runid>` and tagged
`one_e2e_created:<unix-ts>` at creation. The in-test teardown is best-effort; the
cross-repo sweeper is the real guarantee, reaping any `one-e2e-` resource older than
the grace window.
