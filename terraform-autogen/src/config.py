from json import dumps

from pydantic import BaseModel, ConfigDict, Field


class TfProvider(BaseModel):
    name: str
    version: str


class FieldsConfig(BaseModel):
    # Fields to implement in locals
    impl: list[str] = Field(default_factory=list)
    # Fields that are always included (even if computed) in the user input variables and implemented, even if computed
    always_allow: list[str] = Field(default_factory=list)
    # Fields that are never included (even if not computed) in the user input variables (or implemented), due to support/deprecation issues
    never_allow: list[str] = Field(default_factory=list)
    # Fields that should always be marked sensitive in the outputs
    always_sensitive: list[str] = Field(default_factory=list)


class Config(BaseModel):
    model_config = ConfigDict(strict=True)

    provider: str
    resource: str
    fields: FieldsConfig = Field(default_factory=FieldsConfig)
    additional_providers: list[TfProvider] = Field(default_factory=list)


CONFIG: Config = Config(provider="", resource="")


def write_config_schema() -> None:
    """Write the configuration schema to a JSON file."""
    with open("autogen_config_schema.json", "w") as file:
        file.write(dumps(Config.model_json_schema(), indent=2))
