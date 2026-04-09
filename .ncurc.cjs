'use strict';
// Configuration for npm-check-updates (https://github.com/raineorshine/npm-check-updates).
// Mirrors the npmMinimalAgeGate: 2d setting in .yarnrc.yml — skips upgrades to versions
// published less than 2 days ago to guard against first-day supply-chain attacks.

const https = require('https');

const MIN_AGE_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

/**
 * Fetches the publish timestamp for a specific version from the npm registry.
 * @param {string} name - Package name (scoped or unscoped)
 * @param {string} version - Exact version string
 * @returns {Promise<Date | null>}
 */
function fetchPublishDate(name, version) {
  // Encode scoped names: @scope/pkg -> @scope%2Fpkg
  const encoded = name.startsWith('@') ? `@${encodeURIComponent(name.slice(1))}` : name;
  return new Promise((resolve) => {
    const req = https.get(`https://registry.npmjs.org/${encoded}`, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        return resolve(null);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          const meta = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          const ts = meta.time?.[version];
          resolve(ts ? new Date(ts) : null);
        } catch {
          resolve(null);
        }
      });
    });
    req.on('error', () => resolve(null));
    // Abort after 15 s to avoid hanging the upgrade run.
    req.setTimeout(15_000, () => { req.destroy(); resolve(null); });
  });
}

/** @type {import('npm-check-updates').RunOptions} */
module.exports = {
  filterResults: async (name, { upgradedVersion }) => {
    if (!upgradedVersion) return false;
    const published = await fetchPublishDate(name, upgradedVersion);
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
