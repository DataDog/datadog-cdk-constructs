from copy import deepcopy
from json import load
from subprocess import PIPE, run

from src.implementation import IMPL_VARIABLES, update_implementation
from src.outputs import update_outputs
from src.schema import USER_FACING_ATTRIBUTES, extract_block, get_resource_schema
from src.variables import update_variables
from src.versions import update_provider


def main():
    with open("autogen_config.json") as file:
        config = load(file)
    provider = config["provider"]
    resource_name = config["resource"]
    IMPL_VARIABLES.clear()
    IMPL_VARIABLES.update(config.get("impl", []))
    USER_FACING_ATTRIBUTES.clear()
    USER_FACING_ATTRIBUTES.update(config.get("user_input", []))

    if not update_provider(provider):
        return

    run(["terraform", "init", "-upgrade"], check=True, stdout=PIPE)
    schema = get_resource_schema(provider, resource_name)
    resource = extract_block(schema)
    update_variables(deepcopy(resource)) # deepcopy because update_variables mutates the resource
    update_implementation(resource_name, resource)
    update_outputs(resource_name, schema)

    run(["terraform", "fmt"], check=True, stdout=PIPE)


if __name__ == "__main__":
    main()
