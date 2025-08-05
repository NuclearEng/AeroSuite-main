#!/usr/bin/env node

const semver = require('semver');
const required = '18.x';
const current = process.version;

if (!semver.satisfies(current, required)) {
  console.error(`\n[ERROR] Node.js 18.x is required. You are using ${current}. Please switch to Node.js 18.x (e.g., with nvm use 18).\n`);
  process.exit(1);
} else {
  console.log(`[OK] Node.js version ${current} satisfies required version ${required}.`);
} 