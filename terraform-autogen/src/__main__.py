from argparse import ArgumentParser
from copy import deepcopy
from json import load
from subprocess import PIPE, run

from src.implementation import IMPL_VARIABLES, update_implementation
from src.outputs import update_outputs
from src.schema import USER_FACING_ATTRIBUTES, extract_block, get_resource_schema
from src.variables import update_variables
from src.versions import update_provider

DEFAULT_CONFIG_PATH = "autogen_config.json"


def generate(config_path: str, regenerate: bool):
    with open(config_path) as file:
        config = load(file)
    provider = config["provider"]
    resource_name = config["resource"]
    IMPL_VARIABLES.clear()
    IMPL_VARIABLES.update(config.get("impl", []))
    USER_FACING_ATTRIBUTES.clear()
    USER_FACING_ATTRIBUTES.update(config.get("user_input", []))

    if not update_provider(provider) and not regenerate:
        return

    run(["terraform", "init", "-upgrade"], check=True, stdout=PIPE)
    schema = get_resource_schema(provider, resource_name)
    resource = extract_block(schema)
    update_variables(deepcopy(resource))  # deepcopy because update_variables mutates the resource
    update_implementation(resource_name, resource)
    update_outputs(resource_name, schema)

    run(["terraform", "fmt"], check=True, stdout=PIPE)


def main():
    parser = ArgumentParser(description="Terraform autogen script")
    parser.add_argument(
        "--config",
        type=str,
        default=DEFAULT_CONFIG_PATH,
        help="Path to the autogen configuration file (default: autogen_config.json)",
    )
    parser.add_argument(
        "-r",
        "--regenerate",
        action="store_true",
        help="Regenerate all files even if the provider is up-to-date",
        default=False,
    )
    args = parser.parse_args()
    generate(config_path=args.config, regenerate=args.regenerate)


if __name__ == "__main__":
    main()
