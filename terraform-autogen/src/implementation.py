from src.constants import DO_NOT_EDIT_HEADER
from src.schema import TerraformContainer, TerraformObject, TerraformPrimitive, TerraformType

RESOURCE_IMPLEMENTATION_FILE = "resource_impl.tf"

IMPL_VARIABLES: set[str] = set()


def get_field_value(impl_path: str, in_block: bool) -> str:
    if in_block:
        return impl_path  # special case for dynamic blocks
    if impl_path in IMPL_VARIABLES:
        return f"locals.{impl_path.replace('.', '_')}"  # overrides from locals
    return f"var.{impl_path}"  # default case for variables


def generate_field(
    name: str,
    typ: TerraformType,
    impl_path: str,
    in_block: bool = False,
) -> str:
    field_value = get_field_value(impl_path, in_block)
    match typ:
        # this is the special case for multiple blocks, represented as a list of objects
        case TerraformContainer(_, TerraformObject(fields, is_block)) if is_block:
            inner_fields = "\n".join(
                generate_field(k, v, f"{name}.value.{k}", in_block=True) for k, v in fields.items()
            )
            return f"""dynamic "{name}" {{
                        for_each = {field_value} != null ? {field_value} : []
                        content {{
                            {inner_fields}
                        }}
                    }}"""
        case TerraformPrimitive() | TerraformContainer():
            return f"{name} = {field_value}"
        case TerraformObject(fields, is_block, is_optional_block) if is_block and is_optional_block:
            inner_fields = "\n".join(
                generate_field(key, val, f"{impl_path}.{key}", in_block) for key, val in fields.items()
            )
            return f"""dynamic "{name}" {{
                    for_each = {field_value} != null ? [true] : []
                    content {{
                        {inner_fields}
                    }}
                }}"""
        case TerraformObject(fields, is_block):
            inner_fields = "\n".join(
                generate_field(key, val, f"{impl_path}.{key}", in_block) for key, val in fields.items()
            )
            object_separator = "" if is_block else "="
            return f"{name} {object_separator} {{\n{inner_fields}\n}}"
        case _:
            raise ValueError(f"Unknown Terraform type: {typ}")


def update_implementation(resource_name: str, resource: TerraformObject) -> None:
    """
    Updates the Terraform resource implementation file with the specified resource and implemenation of fields.

    Args:
        resource (str): The name of the Terraform resource to be written (e.g., "google_cloud_run_v2_service").
        impl_variables (set[str]): The set of variable names to be implemented in the `locals` block.
        variables (list[TerraformVariable]): The list of variables discovered from the resource schema.
    """
    with open(RESOURCE_IMPLEMENTATION_FILE, "w") as file:
        file.write(DO_NOT_EDIT_HEADER)
        file.write(f'\n\nresource "{resource_name}" "this" {{\n')
        file.write("\n".join(generate_field(name, typ, name) for name, typ in resource.fields.items()))
        file.write("\n}\n")
