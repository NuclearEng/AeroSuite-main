#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Known packages that need specific versions for Node 18
const node18CompatibleVersions = {
  'commander': '^13.0.0',
  'got': '^13.0.0',
  'lru-cache': '^10.2.0',
  'mochawesome-merge': '^4.3.0',
  'react-router-dom': '^6.21.1',
  'yargs': '^17.7.2',
  '@mui/icons-material': '^5.15.2',
  '@mui/material': '^5.15.2',
  '@mui/x-data-grid': '^6.18.6',
  '@mui/x-date-pickers': '^6.18.6',
  'jest': '^29.7.0',
  'puppeteer': '^21.11.0',
  'chartjs-node-canvas': '^4.1.6',
  'mongodb-memory-server': '^9.1.8',
  'wait-on': '^7.2.0',
  'webpack-bundle-analyzer': '^4.10.1'
};

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

console.log('Fixing Node.js 18 compatibility issues...\n');

let updated = false;

// Check and update dependencies
['dependencies', 'devDependencies'].forEach(depType => {
  if (packageJson[depType]) {
    Object.keys(packageJson[depType]).forEach(pkg => {
      if (node18CompatibleVersions[pkg] && packageJson[depType][pkg] !== node18CompatibleVersions[pkg]) {
        console.log(`Updating ${pkg}: ${packageJson[depType][pkg]} → ${node18CompatibleVersions[pkg]}`);
        packageJson[depType][pkg] = node18CompatibleVersions[pkg];
        updated = true;
      }
    });
  }
});

if (updated) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
  console.log('\n✅ package.json updated with Node.js 18 compatible versions');
  console.log('\nNext steps:');
  console.log('1. Run: rm -rf node_modules package-lock.json');
  console.log('2. Run: npm install');
  console.log('3. Run: npm install circular-dependency-plugin@5.2.2 --save-dev');
} else {
  console.log('✅ No updates needed - all packages are already compatible');
} 