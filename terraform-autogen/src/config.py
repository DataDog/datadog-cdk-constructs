from json import dumps
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field


class TfProvider(BaseModel):
    name: str
    version: str


class FieldsConfig(BaseModel):
    impl: list[str] = Field(default_factory=list, description="Fields to implement in locals")
    always_allow: list[str] = Field(
        default_factory=list,
        description="Fields that are always included in user input variables and implemented, even if computed",
    )
    never_allow: list[str] = Field(
        default_factory=list,
        description="Fields that are never included in user input variables or implemented, often due to support/deprecation issues",
    )
    always_sensitive: list[str] = Field(
        default_factory=list, description="Fields that should always be marked sensitive in the outputs"
    )


class Config(BaseModel):
    model_config = ConfigDict(strict=True)

    provider: Annotated[
        str,
        Field(
            description="Terraform provider name to pull the resource from",
            examples=["hashicorp/azurerm", "hashicorp/google"],
        ),
    ]
    resource: Annotated[
        str,
        Field(
            description="Terraform resource from the specified provider to generate a wrapper module",
            examples=["azurerm_windows_web_app", "google_cloud_run_v2_service"],
        ),
    ]
    fields: FieldsConfig = Field(default_factory=FieldsConfig, description="Configuration for logic related to fields")
    additional_providers: list[TfProvider] = Field(
        default_factory=list, description="Additional providers to include in the generated version file"
    )


CONFIG: Config = Config(provider="", resource="")


def write_config_schema() -> None:
    """Write the configuration schema to a JSON file."""
    with open("autogen_config_schema.json", "w") as file:
        file.write(dumps(Config.model_json_schema(), indent=2))
