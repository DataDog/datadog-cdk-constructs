# Usage:

## step 1: 
update `autogen_config.json` in your repo with your provider and resource name (see `autogen_config.example.json` as an example)

## step 2:
In your preferred >=python3.12 environment, in this directory, run
```sh
pip install --editable .
```

note: if using pyenv, this will get you set up:
```sh
pyenv install 3.12.3
brew install pyenv-virtualenv # if not already installed
pyenv virtualenv 
pyenv virtualenv 3.12.3 terraform
pyenv shell terraform
pip install --editable .
```

## step 3
in your repo, run `tf-autogen`

# Produced format:

## `versions.tf`
contains the provider version(s) we are wrapping

## `resource_variables.tf`
contains all the user variables needed.

## `resource_impl.tf`
implements the main resource

## `main.tf`
supplemental implementation (`locals { }`) should live here, along with any additional variables for datadog-specific implementation


# Scheduled Runs

Scheduled runs of this utilize [Campaigner](https://datadoghq.atlassian.net/wiki/spaces/DEVX/pages/2916025668/Campaigns+CLI) to run the script and create PRs, and are [scheduled through GitLab](https://gitlab.ddbuild.io/DataDog/serverless-ci/-/pipeline_schedules). Editing the schedule is done in gitlab, and changes to terraform autogen (or related scripts) are published through the `terraform-autogen-ci-image` CI job, or by manually running the following command within this directory:

```bash
docker buildx build --platform linux/amd64 --tag registry.ddbuild.io/ci/terraform-autogen:latest . --push
```
