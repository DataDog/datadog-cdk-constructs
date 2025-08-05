#!/usr/bin/env python3

import os
import sys
from subprocess import run

os.chdir(os.path.expanduser("~/dd/terraform-aws-lambda-datadog"))
if run(["git", "status", "--porcelain"], capture_output=True, text=True).stdout.strip():
    print("You have uncommitted changes. Please commit or stash them before proceeding.")
    sys.exit(1)
run(["git", "switch", "main"], check=True)
run(["git", "pull"], check=True)

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

create_pr = input("Create a PR with these changes? (y/n): ").strip().lower()
if create_pr == "y":
    run(["git", "add", "main.tf", "README.md"], check=True)
    run(["git", "checkout", "-b", f"{os.environ['USER']}/update-version-{new_version}"], check=True)
    run(["git", "commit", "-m", f"chore: update version to {new_version}"], check=True)
    run(["git", "push", "origin", "HEAD"], check=True)
    run(["gh", "pr", "create", "--fill"], check=True)

print("Done ✅")
