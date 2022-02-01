// Helper script used to bump version within version.json

var fs = require('fs')
var path = require('path')

version_file_path = path.join(__dirname, '..', '..', 'v2', 'version.json');

var new_version = process.argv[2];

var version_json = require(version_file_path);

version_json.version = new_version

fs.writeFileSync(version_file_path, JSON.stringify(version_json, null, 2));
