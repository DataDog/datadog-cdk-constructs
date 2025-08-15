#!/usr/bin/env bash
set -euo pipefail

cd /campaigner/checkout || echo "⚠️ Not in the context of a campaigner checkout"

if [[ -d "modules" ]]; then
	echo "Running tf-autogen in all submodules..."
	for dir in modules/*; do
		if [[ ! -d "$dir" ]]; then
			continue
		fi
		echo "Processing $dir..."
		(cd "$dir" && tf-autogen)
	done
else
	echo "No 'modules' directory found. Running tf-autogen in the current directory..."
	tf-autogen
fi

if ! git diff --name-only | grep -qv '^.*versions\.tf$'; then
    echo "❎ Only versions.tf changed, skipping commit"
    # clear any changes to the working tree
    git add -A && git reset --hard HEAD > /dev/null
    exit 0
fi

# Regenerate docs
echo "Regenerating documentation..."
find modules -type d -maxdepth 1 -mindepth 1 -exec terraform-docs {} --config .terraform-docs.yml \;
