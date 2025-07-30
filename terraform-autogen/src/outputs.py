from src.constants import DO_NOT_EDIT_HEADER, FIELDS_CONFIG
from src.schema import BlockSchema, TerraformObject, extract_block, is_sensitive

RESOURCE_OUTPUTS_FILE = "outputs.tf"


def generate_outputs_file(resource_name: str, resource: TerraformObject) -> str:
    content = [DO_NOT_EDIT_HEADER]
    for param, typ in resource.fields.items():
        description_str = f"\n  description = <<DESCRIPTION\n{typ.description}\nDESCRIPTION" if typ.description else ""
        sensitive = is_sensitive(typ) or param in FIELDS_CONFIG.get("always_sensitive", [])
        sensitive_str = "\nsensitive = true" if sensitive else ""
        content.append(
            f"""output "{param}" {{{description_str}
value = {resource_name}.this.{param}{sensitive_str}
}}"""
        )
    return "\n\n".join(content)


def update_outputs(resource_name: str, schema: BlockSchema) -> None:
    resource = extract_block(schema, include_attribute=lambda name, _: name not in FIELDS_CONFIG.get("never_allow", []))
    with open(RESOURCE_OUTPUTS_FILE, "w") as file:
        file.write(generate_outputs_file(resource_name, resource))
    print(f"Updated {RESOURCE_OUTPUTS_FILE} with resource outputs")
