from dataclasses import dataclass
from json import loads
from subprocess import PIPE, run
from typing import Literal, NotRequired, TypedDict

USER_FACING_ATTRIBUTES = set()


# Terraform Resource Schema
class AttributeSchema(TypedDict):
    type: "TypeSchema"
    description: str
    optional: NotRequired[bool]
    computed: NotRequired[bool]
    sensitive: NotRequired[bool]


class BlockSchema(TypedDict):
    attributes: dict[str, AttributeSchema]
    block_types: dict[str, "NestedBlock"]
    description: NotRequired[str]


type TypeSchema = str | list


class NestedBlockList(TypedDict):
    # assumptions: can have combination of constraints on min, max items
    nesting_mode: Literal["list"]
    block: BlockSchema
    max_items: NotRequired[int]
    min_items: NotRequired[int]


class NestedBlockSingle(TypedDict):
    # assumptions: only reference of timeouts
    # single = at most 1, assume no min constraints are set, so always optional
    nesting_mode: Literal["single"]
    block: BlockSchema


class NestedBlockSet(TypedDict):
    # assumptions: only reference of env vars
    # no min, max constraints
    nesting_mode: Literal["set"]
    block: BlockSchema


type NestedBlock = NestedBlockList | NestedBlockSingle | NestedBlockSet


# Internal Representation
type TerraformType = TerraformPrimitive | TerraformContainer | TerraformObject


@dataclass
class TerraformPrimitive:
    """Represents a primitive type in Terraform"""

    type: Literal["string", "bool", "number"]
    optional: bool = False
    description: str | None = None
    sensitive: bool = False


@dataclass
class TerraformContainer:
    """Represents a list, set, or map type"""

    collection_type: Literal["list", "set", "map"]
    element_type: TerraformType
    optional: bool = False
    description: str | None = None
    sensitive: bool = False


@dataclass
class TerraformObject:
    fields: dict[str, TerraformType]
    is_block: bool
    optional: bool = False
    description: str | None = None
    sensitive: bool = False


def get_resource_schema(provider: str, resource: str) -> BlockSchema:
    result = run(["terraform", "providers", "schema", "-json"], check=True, stdout=PIPE)
    schema = loads(result.stdout)
    resource_schema = schema["provider_schemas"]["registry.terraform.io/" + provider]["resource_schemas"][resource]
    # Combine block and attribute inputs
    if "block" not in resource_schema:
        raise KeyError(f"Resource '{resource}' does not have a 'block' key in its schema.")
    return resource_schema["block"]


def is_user_attribute(name: str, computed: bool) -> bool:
    """An attribute is user facing if it is not a computed-only attribute, with some exceptions."""
    return not computed or name in USER_FACING_ATTRIBUTES


def extract_type(
    schema: TypeSchema, optional: bool = False, description: str | None = None, sensitive: bool = False
) -> TerraformType:
    """
    Recursive function to unpack all Terraform type from the attributeschema's type.
    Returns a TerraformType object
    """
    match schema:
        case "string" | "bool" | "number":
            return TerraformPrimitive(type=schema, optional=optional, description=description, sensitive=sensitive)
        case ["list" | "set" | "map", element_type]:
            return TerraformContainer(
                schema[0],
                extract_type(element_type),
                optional=optional,
                description=description,
                sensitive=sensitive,
            )
        case ["object", dict(fields)]:
            return TerraformObject(
                {k: extract_type(v) for k, v in fields.items()},
                is_block=False,
                optional=optional,
                description=description,
                sensitive=sensitive,
            )
    raise ValueError(f"Unknown schema type: {schema}")


def extract_nested_block(nested_block: NestedBlock) -> TerraformType:
    """
    Extracts a nested block from inside a block's block_types, unpacks it, and returns entire thing as a Terraform.
    Either returns a TerraformObject or TerraformContainer, depending on the nesting mode.
    Assumptions as seen so far: min and max only have value of 1 if at all
        - optional === if min is None
        - if min = 1, say it is required
        - if min = 1 and max = 1, make it a single object not a list
    """
    nesting_mode = nested_block.get("nesting_mode", None)
    if nesting_mode is None:
        raise ValueError(f"Nested block {nested_block} has no nesting mode")
    min_items = nested_block.get("min_items", None)
    max_items = nested_block.get("max_items", None)
    required: bool = min_items is not None and min_items == 1  # required = opposite of optional, required if min = 1
    singleton: bool = max_items is not None and max_items == 1  # make an object, not a list

    match nesting_mode:
        case (
            "single"
        ):  # given the timeouts block as the only example, assume optional and at most 1, return a TerraformObject
            return extract_block(
                nested_block.get("block", {}),
                optional=True,
                description=nested_block.get("description", None),
            )
        case "list":  # min items, max items can both occur
            if singleton:  # if max = 1, make return value a single object
                return extract_block(
                    nested_block.get("block", {}),
                    optional=not required,
                    description=nested_block.get("description", None),
                )
            # has to be a list, so the outside container is optional, internal objects would be required/not optional if they are passed in, and also no description
            inside_block = extract_block(nested_block.get("block", {}), optional=False)
            return TerraformContainer(
                collection_type="list",
                element_type=inside_block,
                optional=not required,
                description=nested_block.get("description", None),
            )

        case "set":  # no min, max constraints from the one env vars example
            inside_block = extract_block(nested_block.get("block", {}))
            return TerraformContainer(
                collection_type="set",
                element_type=inside_block,
                optional=True,
                description=nested_block.get("description", None),
            )


def extract_block(
    block: BlockSchema,
    optional: bool = False,
    description: str | None = None,
    include_attribute=is_user_attribute,
) -> TerraformObject:
    attributes = {
        name: extract_type(
            attribute["type"],
            optional=attribute.get("optional", False),
            description=attribute.get("description", None),
            sensitive=attribute.get("sensitive", False),
        )
        for name, attribute in block.get("attributes", {}).items()
        if include_attribute(name, attribute.get("computed", False))
    }
    blocks = {k: extract_nested_block(v) for k, v in block.get("block_types", {}).items()}
    return TerraformObject(
        fields={**attributes, **blocks},
        is_block=True,
        optional=optional,
        description=description,
    )
