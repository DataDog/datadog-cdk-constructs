from argparse import ArgumentDefaultsHelpFormatter, ArgumentParser
from copy import deepcopy
from json import load
from subprocess import PIPE, run
from typing import NotRequired, TypedDict

from src.constants import FIELDS_CONFIG, FieldsConfig
from src.implementation import update_implementation
from src.outputs import update_outputs
from src.schema import extract_block, get_resource_schema
from src.variables import update_variables
from src.versions import TfProvider, update_provider

DEFAULT_CONFIG_PATH = "autogen_config.json"


class Config(TypedDict):
    provider: str
    resource: str
    fields: NotRequired[FieldsConfig]
    additional_providers: NotRequired[list[TfProvider]]


def generate(config_path: str, regenerate: bool):
    with open(config_path) as file:
        config: Config = load(file)
    provider = config["provider"]
    resource_name = config["resource"]
    FIELDS_CONFIG.update(config.get("fields", {}))

    if not update_provider(provider, config.get("additional_providers", [])) and not regenerate:
        print(f"No update needed for provider '{provider}'. Use --regenerate to force regeneration.")
        return

    run(["terraform", "init", "-upgrade"], check=True, stdout=PIPE)

    print(f"🛠️  {'Reg' if regenerate else 'G'}enerating files for provider '{provider}' and resource '{resource_name}'")
    schema = get_resource_schema(provider, resource_name)
    resource = extract_block(schema)
    update_variables(deepcopy(resource))  # deepcopy because update_variables mutates the resource
    update_implementation(resource_name, resource)
    update_outputs(resource_name, schema)
    print("Tidying up the generated files...")
    run(["terraform", "fmt"], check=True, stdout=PIPE)
    print("✅ Generation complete!")


def main():
    parser = ArgumentParser(description="Terraform autogen script", formatter_class=ArgumentDefaultsHelpFormatter)
    parser.add_argument(
        "--config",
        type=str,
        default=DEFAULT_CONFIG_PATH,
        help="Path to the autogen configuration file",
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
