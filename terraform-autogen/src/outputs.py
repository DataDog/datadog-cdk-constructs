from src.config import Config
from src.constants import DO_NOT_EDIT_HEADER
from src.schema import BlockSchema, TerraformObject, extract_block, is_sensitive

RESOURCE_OUTPUTS_FILE = "outputs.tf"


def generate_outputs_file(config: Config, resource: TerraformObject) -> str:
    content = [DO_NOT_EDIT_HEADER]
    for param, typ in resource.fields.items():
        description_str = f"\n  description = <<DESCRIPTION\n{typ.description}\nDESCRIPTION" if typ.description else ""
        sensitive = is_sensitive(typ) or param in config.fields.always_sensitive
        sensitive_str = "\nsensitive = true" if sensitive else ""
        content.append(
            f"""output "{param}" {{{description_str}
value = {config.resource}.this.{param}{sensitive_str}
}}"""
        )
    return "\n\n".join(content) + "\n"


def update_outputs(config: Config, schema: BlockSchema) -> None:
    resource = extract_block(
        config, schema, include_attribute=lambda config, name, _: name not in config.fields.never_allow
    )
    with open(RESOURCE_OUTPUTS_FILE, "w") as file:
        file.write(generate_outputs_file(config, resource))
    print(f"Updated {RESOURCE_OUTPUTS_FILE} with resource outputs")
