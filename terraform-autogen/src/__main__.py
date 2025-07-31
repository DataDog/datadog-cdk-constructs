from argparse import ArgumentDefaultsHelpFormatter, ArgumentParser
from copy import deepcopy
from subprocess import PIPE, run

from src.config import Config, write_config_schema
from src.implementation import update_implementation
from src.outputs import update_outputs
from src.schema import extract_block, get_resource_schema
from src.variables import update_variables
from src.versions import update_provider

DEFAULT_CONFIG_PATH = "autogen_config.json"


def generate(config_path: str, regenerate: bool):
    with open(config_path) as file:
        config = Config.model_validate_json(file.read())

    write_config_schema()

    if not update_provider(config) and not regenerate:
        print(f"No update needed for provider '{config.provider}'. Use --regenerate to force regeneration.")
        return

    run(["terraform", "init", "-upgrade"], check=True, stdout=PIPE)

    print(
        f"🛠️  {'Reg' if regenerate else 'G'}enerating files for provider '{config.provider}' and resource '{config.resource}'"
    )
    schema = get_resource_schema(config)
    parsed_resource = extract_block(config, schema)
    update_variables(deepcopy(parsed_resource))  # deepcopy because update_variables mutates the resource
    update_implementation(config, parsed_resource)
    update_outputs(config, schema)
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
