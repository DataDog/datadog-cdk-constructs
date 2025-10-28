const fs = require("fs");
const { execSync } = require("child_process");

const cdkVersionRegex =  /cdkVersion:\s*"([~^]?\d+\.\d+\.\d+)"/
const cdkCliVersionRegex = /cdkCliVersion:\s*"([~^]?\d+\.\d+\.\d+)"/

const cdkVersion = cdkVersionRegex.exec(fs.readFileSync(".projenrc.js", "utf8"))[1];
const cdkCliVersion = cdkCliVersionRegex.exec(fs.readFileSync(".projenrc.js", "utf8"))[1];

console.log(`cdkVersion: "${cdkVersion}"`);
console.log(`cdkCliVersion: "${cdkCliVersion}"`);

const tagsWithDates = JSON.parse(execSync("npm view aws-cdk-lib time --json", { encoding: "utf8" }).trim());

const targetTime = new Date();
targetTime.setMonth(targetTime.getMonth() - 1);

let targetVersion = null;
let closestTimeDiff = Infinity;

for (const [version, dateStr] of Object.entries(tagsWithDates)) {
  // Skip non-version entries like 'created', 'modified'
  if (version === 'created' || version === 'modified') continue;
  
  const versionDate = new Date(dateStr);
  
  const timeDiff = Math.abs(targetTime.getTime() - versionDate.getTime());
  if (timeDiff < closestTimeDiff) {
    closestTimeDiff = timeDiff;
    targetVersion = version;
  }
}

console.log(`Target date (1 month ago): ${targetTime.toISOString().split('T')[0]}`);
console.log(`aws-cdk-lib version from ~1 month ago: "${targetVersion}"`);

if (cdkVersion !== targetVersion || cdkCliVersion !== targetVersion) {
  console.log("Upgrading CDK versions...");
  
  // Read the entire .projenrc.js file
  let projenContent = fs.readFileSync(".projenrc.js", "utf8");
  
  // Update cdkVersion if it's different from latest
  if (cdkVersion !== targetVersion) {
    projenContent = projenContent.replace(
      cdkVersionRegex,
      `cdkVersion: "${targetVersion}"`
    );
    console.log(`Updated cdkVersion to: "${targetVersion}"`);
  }
  
  // Update cdkCliVersion if it's different from latest
  if (cdkCliVersion !== targetVersion) {
    projenContent = projenContent.replace(
      cdkCliVersionRegex,
      `cdkCliVersion: "^${targetVersion}"`
    );
    console.log(`Updated cdkCliVersion to: "${targetVersion}"`);
  }
  
  // Write the updated content back to the file
  fs.writeFileSync(".projenrc.js", projenContent);
  console.log("CDK versions upgraded successfully!");
} else {
  console.log("CDK versions are already up to date.");
}
