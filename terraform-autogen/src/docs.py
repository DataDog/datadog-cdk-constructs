from functools import cache
from urllib.request import urlopen

from src.schema import TerraformObject

ARGUMENTS_DELIMITER = """Reference

The following arguments are supported:"""

ATTRIBUTES_DELIMITER = """Reference

In addition to the Arguments listed above - the following Attributes are exported:"""


def get_fields_from_section(docs: str, delimiter: str) -> dict[str, str]:
    """Extract field documentation from the markdown content of a Terraform resource documentation page.
    Goes from the section starting with the given delimiter until blocks are encountered."""
    if delimiter not in docs:
        print(f"⚠️ Delimiter {delimiter.splitlines()[0]} not found in documentation, skipping field extraction.")
        return {}
    field_docs = {}
    arguments = docs.split(delimiter)[1]
    for line in arguments.splitlines():
        if line.startswith("* `"):
            parts = line.split("`", maxsplit=2)
            doc = parts[2].strip(" -").removeprefix("(Optional) ").removeprefix("(Required) ")
            if not doc.endswith("block as defined below."):
                field_docs[parts[1]] = doc
        if line.startswith(("An ", "A ")):
            # getting into the block definitions, stop processing
            break

    return field_docs


def get_fields_from_docs(docs: str) -> dict[str, str]:
    return {
        **get_fields_from_section(docs, ARGUMENTS_DELIMITER),
        **get_fields_from_section(docs, ATTRIBUTES_DELIMITER),
    }


@cache
def get_field_docs(provider: str, resource_name: str) -> dict[str, str]:
    publisher, provider_name = provider.split("/")
    short_resource = resource_name.removeprefix(provider_name + "_")
    url = f"https://raw.githubusercontent.com/{publisher}/terraform-provider-{provider_name}/refs/heads/main/website/docs/r/{short_resource}.html.markdown"
    with urlopen(url) as response:
        if response.status != 200:
            raise ValueError(f"Failed to fetch provider versions: {response.status}")
        docs = response.read().decode("utf-8")

    return get_fields_from_docs(docs)


def enrich_resource(provider: str, resource_name: str, resource: TerraformObject) -> None:
    """
    Enrich the schema with documentation from the provider's website.
    This is a placeholder function, as the actual implementation would depend on the provider's documentation structure.
    """
    field_docs = get_field_docs(provider, resource_name)
    for name, field in resource.fields.items():
        if field.description is None and (doc := field_docs.get(name)):
            field.description = doc
