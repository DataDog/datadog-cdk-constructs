from argparse import ArgumentDefaultsHelpFormatter, ArgumentParser
from copy import deepcopy
from subprocess import PIPE, run

from src.config import Config, write_config_schema
from src.docs import enrich_resource
from src.implementation import update_implementation
from src.outputs import update_outputs
from src.schema import extract_block, get_resource_schema
from src.variables import update_variables
from src.versions import update_provider

DEFAULT_CONFIG_PATH = "autogen_config.json"


def generate(config_path: str):
    with open(config_path) as file:
        config = Config.model_validate_json(file.read())

    write_config_schema()

    print(f"🛠️  Generating files for provider '{config.provider}' and resource '{config.resource}'")
    update_provider(config)
    run(["terraform", "init", "-upgrade"], check=True, stdout=PIPE)

    schema = get_resource_schema(config)
    parsed_resource = extract_block(config, schema)
    if config.scrape_docs:
        print("📝 Scraping documentation for field descriptions...")
        enrich_resource(config.provider, config.resource, parsed_resource)
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
    args = parser.parse_args()
    generate(config_path=args.config)


if __name__ == "__main__":
    main()
