from json import loads
from os import path
from urllib.request import urlopen

from src.config import Config, TfProvider
from src.constants import DO_NOT_EDIT_HEADER

VERSIONS_FILE = "versions.tf"


def generate_versions_file(provider: str, version: str, additional_providers: list[TfProvider]) -> str:
    providers = [TfProvider(name=provider, version=version), *additional_providers]
    providers_str = "\n".join(
        f"""    {p.name.split("/")[1]} = {{
      source  = "{p.name}"
      version = ">= {p.version}"
    }}"""
        for p in providers
    )
    return f"""{DO_NOT_EDIT_HEADER}

terraform {{
  required_version = ">= 1.5.0"

  required_providers {{
{providers_str}
  }}
}}
"""


def safe_int(value: str) -> int | None:
    try:
        return int(value)
    except ValueError:
        return None


def get_max_version(versions: list[dict[str, str]]) -> str:
    """get the maximum version through tuple comparison
    e.g. "1.2.3" -> (1, 2, 3)"""
    # split each version string by `.`, convert to int, find the max tuple, and convert back to string
    version_tuples = (tuple(map(safe_int, entry["version"].split("."))) for entry in versions)
    valid_versions = filter(lambda t: None not in t, version_tuples)
    return ".".join(map(str, max(valid_versions)))


def get_provider_version(provider: str) -> str:
    with urlopen(f"https://registry.terraform.io/v1/providers/{provider}/versions") as response:
        if response.status != 200:
            raise ValueError(f"Failed to fetch provider versions: {response.status}")
        data = loads(response.read())
    versions = data.get("versions", [])
    if not versions:
        raise ValueError(f"No versions found for provider '{provider}'")
    return get_max_version(versions)


def update_provider(config: Config) -> bool:
    """
    Update the Terraform provider configuration.

    Returns whether an update was needed or not.
    """
    version = get_provider_version(config.provider)

    current_content = None
    if path.exists(VERSIONS_FILE):
        with open(VERSIONS_FILE) as file:
            current_content = file.read()

    new_content = generate_versions_file(config.provider, version, config.additional_providers)
    if current_content == new_content:
        return False
    with open(VERSIONS_FILE, "w") as file:
        file.write(new_content)
    return True
