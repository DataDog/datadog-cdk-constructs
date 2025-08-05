#!/usr/bin/env python3

import os
import sys

os.chdir(os.path.expanduser("~/dd/terraform-aws-lambda-datadog"))

with open("main.tf") as f:
    main = f.read()

version_line = next(
    filter(
        lambda line: line.strip().startswith("dd_sls_terraform_module"),
        main.splitlines(),
    )
)
if not version_line:
    raise ValueError("Could not find dd_sls_terraform_module line in main.tf")
current_version = version_line.split("=")[1].strip().strip('"')

print(f"Current version: {current_version}")
if len(sys.argv) == 1:
    new_version = input("Enter new version: ")
else:
    new_version = sys.argv[1]

with open("main.tf", "w") as f:
    f.write(main.replace(current_version, new_version))

with open("README.md", "r+") as f:
    readme = f.read()
    f.seek(0)
    f.write(readme.replace(current_version, new_version))
    f.truncate()

