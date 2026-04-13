'use strict';
// Configuration for npm-check-updates (https://github.com/raineorshine/npm-check-updates).
// Mirrors the npmMinimalAgeGate: 2d setting in .yarnrc.yml — skips upgrades to packages
// whose latest published version is less than 2 days old, guarding against first-day
// supply-chain attacks.
//
// We use `reject` (a static list built at load time) rather than `filterResults` because
// ncu does not apply `filterResults` to the package.json write when invoked via --upgrade
// from a config file; it only filters the programmatic return value of ncu.run().

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const MIN_AGE_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

/**
 * Returns the packages in ncu's --filter list by reading .projen/tasks.json.
 */
function getNcuFilterPackages() {
  try {
    const tasks = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), '.projen', 'tasks.json'), 'utf8'),
    );
    const exec = tasks?.tasks?.upgrade?.steps?.[0]?.exec ?? '';
    const m = exec.match(/--filter=(\S+)/);
    return m ? m[1].split(',') : [];
  } catch {
    return [];
  }
}

/**
 * Synchronously returns the publish date of a package's `latest` dist-tag version.
 * Spawns a child node process to make the HTTPS call synchronously.
 * The inline script is kept on a single line because multiline strings
 * serialized with JSON.stringify produce literal \n sequences that the shell
 * passes as two characters (\\ and n), which are not statement separators in JS.
 * Returns null when the date cannot be determined (fail open).
 */
function getLatestPublishDateSync(name) {
  const encoded = name.startsWith('@') ? '@' + encodeURIComponent(name.slice(1)) : name;
  const url = `https://registry.npmjs.org/${encoded}`;
  // prettier-ignore
  const script = `const https=require('https'),chunks=[];const req=https.get(${JSON.stringify(url)},(res)=>{res.on('data',(c)=>chunks.push(c));res.on('end',()=>{try{const m=JSON.parse(Buffer.concat(chunks).toString('utf8'));const l=m['dist-tags']&&m['dist-tags'].latest;process.stdout.write((l&&m.time&&m.time[l])||'');}catch{process.stdout.write('');}});});req.on('error',()=>process.stdout.write(''));req.setTimeout(10000,()=>{process.stdout.write('');process.exit(0);});`;
  try {
    const out = execSync(`node -e ${JSON.stringify(script)}`, {
      timeout: 15000,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return out.trim() ? new Date(out.trim()) : null;
  } catch {
    return null;
  }
}

// Build the reject list synchronously at module load time, before ncu resolves versions.
const reject = [];
for (const pkg of getNcuFilterPackages()) {
  const published = getLatestPublishDateSync(pkg);
  if (!published) continue; // cannot determine age — fail open
  const ageMs = Date.now() - published.getTime();
  if (ageMs < MIN_AGE_MS) {
    const ageDays = (ageMs / (1000 * 60 * 60 * 24)).toFixed(1);
    console.log(`ncu-age-filter: skipping ${pkg} — latest published ${ageDays}d ago (minimum: 2d)`);
    reject.push(pkg);
  }
}

/** @type {import('npm-check-updates').RunOptions} */
module.exports = { reject };
