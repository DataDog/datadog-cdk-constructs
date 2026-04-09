'use strict';
// Configuration for npm-check-updates (https://github.com/raineorshine/npm-check-updates).
// Mirrors the npmMinimalAgeGate: 2d setting in .yarnrc.yml — skips upgrades to versions
// published less than 2 days ago to guard against first-day supply-chain attacks.
//
// NOTE: filterResults must be synchronous. ncu does not await async callbacks, so
// an async function always returns a truthy Promise and the filter has no effect.
// We use execSync + a child node process to make the HTTP call synchronous.

const { execSync } = require('child_process');

const MIN_AGE_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

/**
 * Fetches the publish timestamp for a specific npm package version synchronously
 * by spawning a child Node.js process that makes the HTTPS request.
 * Returns null when the date cannot be determined (fail open).
 */
function getPublishDateSync(name, version) {
  // Encode scoped names: @scope/pkg -> @scope%2Fpkg
  const encoded = name.startsWith('@') ? '@' + encodeURIComponent(name.slice(1)) : name;

  // Inline script run in a child process — keep it on one logical block so
  // JSON.stringify handles all escaping for us when it becomes a CLI argument.
  const script = `
const https = require('https');
const chunks = [];
const req = https.get('https://registry.npmjs.org/' + ${JSON.stringify(encoded)}, (res) => {
  res.on('data', (c) => chunks.push(c));
  res.on('end', () => {
    try {
      const m = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      process.stdout.write((m.time && m.time[${JSON.stringify(version)}]) || '');
    } catch { process.stdout.write(''); }
  });
});
req.on('error', () => process.stdout.write(''));
req.setTimeout(10000, () => { process.stdout.write(''); process.exit(0); });
`.trim();

  try {
    const result = execSync(`node -e ${JSON.stringify(script)}`, {
      timeout: 15000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result.trim() ? new Date(result.trim()) : null;
  } catch {
    return null;
  }
}

/** @type {import('npm-check-updates').RunOptions} */
module.exports = {
  filterResults: (name, { upgradedVersion }) => {
    if (!upgradedVersion) return false;
    const published = getPublishDateSync(name, upgradedVersion);
    if (!published) return true; // unknown age — fail open
    const ageMs = Date.now() - published.getTime();
    if (ageMs < MIN_AGE_MS) {
      const ageDays = (ageMs / (1000 * 60 * 60 * 24)).toFixed(1);
      console.log(`Skipping ${name}@${upgradedVersion} — published ${ageDays}d ago (minimum: 2d)`);
      return false;
    }
    return true;
  },
};
