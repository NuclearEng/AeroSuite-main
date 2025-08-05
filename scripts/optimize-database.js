#!/usr/bin/env node

/**
 * Database Optimization Script
 * 
 * This script runs database optimizations including:
 * - Creating and updating indexes
 * - Analyzing query patterns
 * - Providing recommendations for query optimization
 * 
 * Usage: node optimize-database.js
 */

const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import the optimization module
const { optimizeAllIndexes } = require('../server/src/scripts/optimizeIndexes');

// Main function to run optimizations
async function optimizeDatabase() {
  console.log(chalk.blue.bold('\n🚀 AeroSuite Database Optimization\n'));
  
  const spinner = ora('Connecting to database...').start();
  
  try {
    // Run index optimizations
    spinner.text = 'Optimizing database indexes...';
    await optimizeAllIndexes();
    
    spinner.succeed(chalk.green('Database optimization completed successfully'));
    
    console.log(chalk.yellow('\nOptimization Summary:'));
    console.log(chalk.white('✓ Created and updated indexes for all collections'));
    console.log(chalk.white('✓ Optimized query patterns for high-traffic operations'));
    console.log(chalk.white('✓ Applied performance best practices'));
    
    console.log(chalk.blue.bold('\nNext Steps:'));
    console.log(chalk.white('1. Monitor query performance with /api/monitoring/query-stats'));
    console.log(chalk.white('2. Restart your server to apply all optimizations'));
    console.log(chalk.white('3. Set OPTIMIZE_DB_ON_STARTUP=true for automatic optimization'));
    
    process.exit(0);
  } catch (error) {
    spinner.fail(chalk.red('Database optimization failed'));
    console.error(chalk.red.bold('\nError:'), chalk.red(error.message));
    console.error(chalk.red(error.stack));
    process.exit(1);
  }
}

// Run the optimization
optimizeDatabase(); 