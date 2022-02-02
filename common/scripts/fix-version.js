// Helper script used to fix package.json version resetting on builds, and helping bump version.json after releases

// Copies the version from version.json into package.json
var fs = require("fs");
var path = require("path");

version_file_path = path.join(__dirname, "..", "..", "v2", "version.json");
package_file_path = path.join(__dirname, "..", "..", "v2", "package.json");

var version_json = require(version_file_path);
var package_json = require(package_file_path);

package_json.version = version_json.version;
fs.writeFileSync(package_file_path, JSON.stringify(package_json, null, 2));
