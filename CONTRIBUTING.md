# Contributing

We love pull requests. Here's a quick guide.

1. Fork, clone and branch off `main`:
    ```bash
    git clone git@github.com:<your-username>/datadog-cdk-constructs.git
    git checkout -b <my-branch>
    ```
2. Install the repositories dependencies, `yarn install`.
3. Make your changes.
4. Test your changes using CDK commands such as `cdk synth`, `cdk diff`, and `cdk deploy`
5. Ensure the unit tests pass:
    ```bash
    yarn test
    ```
6. Push to your fork and [submit a pull request][pr].

[pr]: https://github.com/your-username/datadog-cdk-constructs/compare/DataDog:main...main

At this point you're waiting on us. We may suggest some changes or improvements or alternatives.
