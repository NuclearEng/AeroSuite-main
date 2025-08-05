#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('\n[auto-migrate] Running codemods for known migrations...');

// Detect updated packages (simple check for now, can be extended)
const updatedPackages = [];
if (fs.existsSync('package.json') && fs.existsSync('package-lock.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  // Add more sophisticated detection as needed
  if (pkg.dependencies && pkg.dependencies['@mui/material']) {
    updatedPackages.push('@mui/material');
  }
  if (pkg.dependencies && pkg.dependencies['@mui/styles']) {
    updatedPackages.push('@mui/styles');
  }
  if (pkg.dependencies && pkg.dependencies['@mui/base']) {
    updatedPackages.push('@mui/base');
  }
  if (pkg.dependencies && pkg.dependencies['react']) {
    updatedPackages.push('react');
  }
  if (pkg.dependencies && pkg.dependencies['babel']) {
    updatedPackages.push('babel');
  }
}

// Run codemods for each known migration
try {
  if (updatedPackages.includes('@mui/material') || updatedPackages.includes('@mui/styles')) {
    console.log('[auto-migrate] Running MUI v4→v5 codemods...');
    execSync('npx @mui/codemod v5.0.0/preset-safe src', { stdio: 'inherit' });
  }
  // Add more codemods as needed
  // Example: React 17→18, Babel, etc.
  // if (updatedPackages.includes('react')) { ... }
} catch (err) {
  console.error('[auto-migrate] Codemod failed:', err.message);
}

console.log('[auto-migrate] Codemods complete.'); 