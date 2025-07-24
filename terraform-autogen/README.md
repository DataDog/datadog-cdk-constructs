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


