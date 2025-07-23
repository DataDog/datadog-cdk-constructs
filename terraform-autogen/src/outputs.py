from src.constants import DO_NOT_EDIT_HEADER
from src.schema import BlockSchema, TerraformObject, extract_block

RESOURCE_OUTPUTS_FILE = "outputs.tf"


def generate_outputs_file(resource_name: str, resource: TerraformObject) -> str:
    content = [DO_NOT_EDIT_HEADER]
    for param, typ in resource.fields.items():
        description_str = ""
        if typ.description:
            description_str = f"\n  description = <<DESCRIPTION\n{typ.description}\nDESCRIPTION"
        content.append(
            f"""output "{param}" {{{description_str}
value = {resource_name}.this.{param}
}}"""
        )
    return "\n\n".join(content)


def update_outputs(resource_name: str, schema: BlockSchema) -> None:
    resource = extract_block(schema, include_attribute=lambda *_: True)
    with open(RESOURCE_OUTPUTS_FILE, "w") as file:
        file.write(generate_outputs_file(resource_name, resource))
