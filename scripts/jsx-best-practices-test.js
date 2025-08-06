#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

try {
  execSync('node ' + path.join(__dirname, 'jsx-best-practices.js'), { stdio: 'inherit' });
  process.exit(0);
} catch (error) {
  console.error('JSX Best Practices test failed:', error.message);
  process.exit(1);
}