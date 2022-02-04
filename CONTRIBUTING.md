# Contributing

We love pull requests. Here's a quick guide.

_Please refer to the README.md for information about the structure of this repo (note that this repo supports our packages `datadog-cdk-constructs` and `datadog-cdk-constructs-v2`_)

1. Fork, clone and branch off `main`:
    ```bash
    git clone git@github.com:<your-username>/datadog-cdk-constructs.git
    git checkout -b <my-branch>
    ```
1. Install dependencies with `yarn install`. Do this within the repo root, as well as within the project version you plan to edit (`v1` or `v2`).
1. Make your changes.
1. Run unit tests with `yarn test` (must also be run in `v1` or `v2` root):
    - If common files were changed, please run unit tests in both `v1` and `v2` folders.
1. Manually test your changes using CDK commands such as `cdk synth`, `cdk diff`, and `cdk deploy`.
    - Please see the [README.md](README.md#testing) for instructions on how to manually test.
1. Push to your fork and [submit a pull request][pr].

[pr]: https://github.com/your-username/datadog-cdk-constructs/compare/DataDog:main...main

At this point you're waiting on us. We may suggest some changes or improvements or alternatives.
