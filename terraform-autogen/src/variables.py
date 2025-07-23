#!/usr/bin/env python3


from .schema import (
    TerraformContainer,
    TerraformObject,
    TerraformPrimitive,
    TerraformType,
)

RESOURCE_VARIABLES_FILE = "resource_variables.tf"


def display_tf_type(tf_type: TerraformType) -> str:
    """
    Returns a string representation of the Terraform type.
    """
    type_str = ""
    match tf_type:
        case TerraformPrimitive(e):
            type_str = e
        case TerraformContainer(typ, e):
            type_str = f"{typ}({display_tf_type(e)})"
        case TerraformObject(fields):
            field_str = ",\n".join(
                f"{k} = {display_tf_type(v)}" for k, v in fields.items()
            )
            type_str = f"object({{\n{field_str}\n}})"
        case _:
            raise ValueError(f"Unknown Terraform type: {tf_type}")

    if tf_type.optional:
        return f"optional({type_str})"
    return type_str


def generate_variables_file(resource: TerraformObject) -> str:
    """
    Prints the Terraform variables in a format suitable for Terraform configuration files.
    """
    content = []
    for param, typ in resource.fields.items():
        optional_str = "\ndefault = null\n  nullable = true" if typ.optional else ""
        description_str = ""
        if typ.description:
            description_str = (
                f"\n  description = <<DESCRIPTION\n{typ.description}\nDESCRIPTION"
            )
        typ.optional = False  # reset optional to false for the top variable definition level, we use nullable instead
        content.append(
            f"""variable "{param}" {{
type = {display_tf_type(typ)}{optional_str}{description_str}
}}"""
        )
    return "\n\n".join(content)


def update_variables(resource: TerraformObject) -> None:
    with open(RESOURCE_VARIABLES_FILE, "w") as file:
        file.write(generate_variables_file(resource))
