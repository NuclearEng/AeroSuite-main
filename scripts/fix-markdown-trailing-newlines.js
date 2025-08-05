#!/usr/bin/env node

/**
 * Fix Markdown Trailing Newlines
 * 
 * This script ensures all markdown files end with exactly one newline character.
 * Fixes MD047 markdownlint rule violations.
 * 
 * Usage:
 *   node scripts/fix-markdown-trailing-newlines.js [--check] [--path <path>]
 *   
 * Options:
 *   --check    Check mode only, exit with error if files need fixing
 *   --path     Specific path to check/fix (default: entire project)
 *   --verbose  Show detailed output
 */

const fs = require('fs').promises;
const path = require('path');
const { readdir } = require('fs').promises;

// Parse command line arguments
const args = process.argv.slice(2);
const checkMode = args.includes('--check');
const verbose = args.includes('--verbose');
const pathIndex = args.indexOf('--path');
const targetPath = pathIndex !== -1 && args[pathIndex + 1] ? args[pathIndex + 1] : '.';

// Patterns to ignore
const ignorePatterns = [
  'node_modules',
  'dist',
  'build',
  '.git',
  'coverage',
  '.next',
  'out'
];

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

const log = {
  error: (msg) => console.log(`${colors.red}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}${msg}${colors.reset}`),
  gray: (msg) => console.log(`${colors.gray}${msg}${colors.reset}`)
};

/**
 * Recursively find all markdown files
 */
async function findMarkdownFiles(dir, files = []) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip ignored directories
      if (entry.isDirectory() && ignorePatterns.includes(entry.name)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        await findMarkdownFiles(fullPath, files);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      log.error(`Error scanning directory ${dir}: ${error.message}`);
    }
  }
  
  return files;
}

/**
 * Check if a file ends with exactly one newline
 */
async function checkTrailingNewline(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    if (content.length === 0) {
      return { needsFix: false, isEmpty: true };
    }

    // Check if file ends with exactly one newline
    const endsWithNewline = content.endsWith('\n');
    const endsWithMultipleNewlines = content.endsWith('\n\n');
    
    return {
      needsFix: !endsWithNewline || endsWithMultipleNewlines,
      isEmpty: false,
      endsWithNewline,
      endsWithMultipleNewlines
    };
  } catch (error) {
    log.error(`Error reading ${filePath}: ${error.message}`);
    return { needsFix: false, error: true };
  }
}

/**
 * Fix trailing newline in a file
 */
async function fixTrailingNewline(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    if (content.length === 0) {
      return { fixed: false, isEmpty: true };
    }

    // Remove all trailing newlines
    content = content.replace(/\n+$/, '');
    
    // Add exactly one newline
    content += '\n';
    
    await fs.writeFile(filePath, content, 'utf8');
    
    return { fixed: true };
  } catch (error) {
    log.error(`Error fixing ${filePath}: ${error.message}`);
    return { fixed: false, error: true };
  }
}

/**
 * Main function
 */
async function main() {
  log.info('🔍 Markdown Trailing Newline Checker\n');
  
  // Check if target path exists
  try {
    await fs.access(targetPath);
  } catch (error) {
    log.error(`Target path does not exist: ${targetPath}`);
    process.exit(1);
  }
  
  // Find all markdown files
  const files = await findMarkdownFiles(targetPath);
  
  log.gray(`Found ${files.length} markdown files to check...\n`);
  
  let filesNeedingFix = [];
  let filesFixed = [];
  let errors = [];
  
  // Process each file
  for (const file of files) {
    const result = await checkTrailingNewline(file);
    
    if (result.error) {
      errors.push(file);
      continue;
    }
    
    if (result.isEmpty) {
      if (verbose) {
        log.gray(`⚪ ${file} (empty file)`);
      }
      continue;
    }
    
    if (result.needsFix) {
      filesNeedingFix.push(file);
      
      if (!checkMode) {
        const fixResult = await fixTrailingNewline(file);
        if (fixResult.fixed) {
          filesFixed.push(file);
          log.success(`✓ Fixed: ${file}`);
        } else {
          errors.push(file);
        }
      } else {
        log.warning(`⚠ Needs fix: ${file}`);
        if (verbose && result.endsWithMultipleNewlines) {
          log.gray(`  → Multiple trailing newlines detected`);
        } else if (verbose && !result.endsWithNewline) {
          log.gray(`  → No trailing newline`);
        }
      }
    } else if (verbose) {
      log.gray(`✓ OK: ${file}`);
    }
  }
  
  // Summary
  log.info('\n📊 Summary:');
  log.gray(`Total files checked: ${files.length}`);
  
  if (checkMode) {
    log.warning(`Files needing fix: ${filesNeedingFix.length}`);
    if (filesNeedingFix.length > 0) {
      log.warning('\nRun without --check to fix these files automatically.');
      process.exit(1);
    }
  } else {
    log.success(`Files fixed: ${filesFixed.length}`);
  }
  
  if (errors.length > 0) {
    log.error(`Errors: ${errors.length}`);
    errors.forEach(file => log.error(`  - ${file}`));
  }
  
  if (filesNeedingFix.length === 0 && errors.length === 0) {
    log.success('\n✨ All markdown files have proper trailing newlines!');
  }
}

// Run the script
main().catch(error => {
  log.error('Fatal error: ' + error.message);
  process.exit(1);
});