const { yamlParse } = require("yaml-cfn");
const { readFileSync, writeFileSync } = require("fs");

let templateString = readFileSync("template.yaml", {
  encoding: "utf8",
  flag: "r",
});
const template = yamlParse(templateString);

const templateVersion =
  template.Mappings.Constants.DdRemoteInstrumentApp.Version;
// argv[2] because node[0] filename[1] arg[2]
templateString = templateString.replace(templateVersion, process.argv[2]);

writeFileSync("template.yaml", templateString);
