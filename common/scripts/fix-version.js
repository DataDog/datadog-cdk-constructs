// Helper script used to fix package.json version resetting on builds, and helping bump version.json after releases

// Copies the version from version.json into package.json
var fs = require("fs");
var path = require("path");

if (process.argv.length != 3) {
  throw new Error(
    "Please include 1 (and only 1) argument: the target folder (either v1 or v2)"
  );
}

var folder = process.argv[2];

if (folder != "v1" && folder != "v2") {
  throw new Error(
    `The only folder arguments accepted are v1 and v2, you inputted: ${folder}`
  );
}

version_file_path = path.join(__dirname, "..", "..", folder, "version.json");
package_file_path = path.join(__dirname, "..", "..", folder, "package.json");

var version_json = require(version_file_path);
var package_json = require(package_file_path);

package_json.version = version_json.version;
fs.writeFileSync(package_file_path, JSON.stringify(package_json, null, 2));
