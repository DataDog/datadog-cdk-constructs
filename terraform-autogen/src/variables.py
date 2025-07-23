#!/usr/bin/env python3


from .schema import TerraformContainer, TerraformObject, TerraformPrimitive, TerraformType

RESOURCE_VARIABLES_FILE = "resource_variables.tf"


def display_tf_type(tf_type: TerraformType) -> str:
    """
    Returns a string representation of the Terraform type.
    """
    match tf_type:
        case TerraformPrimitive(e, optional):
            if optional:
                return f"optional({e})"
            return e
        case TerraformContainer(typ, e):
            return f"{typ}({display_tf_type(e)})"
        case TerraformObject(fields):
            field_str = ",\n".join(
                f"{k} = {display_tf_type(v)}" for k, v in fields.items()
            )
            return f"object({{\n{field_str}\n}})"
        case _:
            raise ValueError(f"Unknown Terraform type: {tf_type}")


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
