#!/usr/bin/env node

/**
 * Database Seeder CLI
 * 
 * @task TS356 - Test data generation implementation
 * 
 * This script provides a command-line interface to seed the database with test data.
 * It uses the DatabaseSeeder class to generate and insert realistic test data.
 */

const { program } = require('commander');
const chalk = require('chalk');
const mongoose = require('mongoose');
const { createSpinner } = require('nanospinner');
const DatabaseSeeder = require('../server/src/utils/databaseSeeder');
const { logger } = require('../server/src/utils/logger');

// Configure the CLI
program
  .name('seed-database')
  .description('Seed the database with test data')
  .version('1.0.0');

// Default environment configurations
const environments = {
  development: {
    counts: {
      users: 10,
      customers: 20,
      suppliers: 15,
      inspections: 30,
      products: 25,
      defects: 40
    },
    clearExisting: true
  },
  testing: {
    counts: {
      users: 20,
      customers: 50,
      suppliers: 30,
      inspections: 100,
      products: 80,
      defects: 120
    },
    clearExisting: true
  },
  ci: {
    counts: {
      users: 5,
      customers: 10,
      suppliers: 8,
      inspections: 15,
      products: 12,
      defects: 20
    },
    clearExisting: true
  },
  minimal: {
    counts: {
      users: 3,
      customers: 5,
      suppliers: 5,
      inspections: 10,
      products: 8,
      defects: 15
    },
    clearExisting: true
  }
};

// Add seed command
program
  .command('seed')
  .description('Seed the database with test data')
  .option('-e, --env <environment>', 'Environment configuration to use', 'development')
  .option('-c, --clear', 'Clear existing data before seeding', true)
  .option('-s, --seed <seed>', 'Seed for reproducible data generation')
  .option('--users <count>', 'Number of users to generate')
  .option('--customers <count>', 'Number of customers to generate')
  .option('--suppliers <count>', 'Number of suppliers to generate')
  .option('--inspections <count>', 'Number of inspections to generate')
  .option('--products <count>', 'Number of products to generate')
  .option('--defects <count>', 'Number of defects to generate')
  .option('--mongo-uri <uri>', 'MongoDB connection URI', process.env.MONGO_URI || 'mongodb://localhost:27017/aerosuite')
  .action(async (options) => {
    const spinner = createSpinner('Connecting to database...').start();
    
    try {
      // Connect to MongoDB
      await mongoose.connect(options.mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      spinner.success({ text: 'Connected to database' });
      
      // Get environment configuration
      const envConfig = environments[options.env] || environments.development;
      
      // Override with command-line options
      const config = {
        seed: options.seed || `aerosuite-${options.env}-${Date.now()}`,
        clearExisting: options.clear !== undefined ? options.clear : envConfig.clearExisting,
        counts: {
          users: options.users ? parseInt(options.users, 10) : envConfig.counts.users,
          customers: options.customers ? parseInt(options.customers, 10) : envConfig.counts.customers,
          suppliers: options.suppliers ? parseInt(options.suppliers, 10) : envConfig.counts.suppliers,
          inspections: options.inspections ? parseInt(options.inspections, 10) : envConfig.counts.inspections,
          products: options.products ? parseInt(options.products, 10) : envConfig.counts.products,
          defects: options.defects ? parseInt(options.defects, 10) : envConfig.counts.defects
        }
      };
      
      // Log configuration
      console.log(chalk.blue('Seeding database with configuration:'));
      console.log(chalk.blue('Environment:'), chalk.green(options.env));
      console.log(chalk.blue('Seed:'), chalk.green(config.seed));
      console.log(chalk.blue('Clear existing:'), chalk.green(config.clearExisting));
      console.log(chalk.blue('Counts:'));
      Object.entries(config.counts).forEach(([key, value]) => {
        console.log(`  ${chalk.blue(key)}: ${chalk.green(value)}`);
      });
      
      // Create and run seeder
      const seeder = new DatabaseSeeder(config);
      const seedSpinner = createSpinner('Seeding database...').start();
      
      await seeder.seedAll();
      
      seedSpinner.success({ text: 'Database seeded successfully' });
      
      // Print summary
      console.log(chalk.green('\nSeeding complete!'));
      console.log(chalk.blue('Generated entities:'));
      Object.entries(seeder.generatedIds).forEach(([key, value]) => {
        console.log(`  ${chalk.blue(key)}: ${chalk.green(value.length)}`);
      });
      
      // Disconnect from MongoDB
      await mongoose.disconnect();
      console.log(chalk.blue('Disconnected from database'));
      
      process.exit(0);
    } catch (error) {
      spinner.error({ text: 'Error seeding database' });
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// Add clear command
program
  .command('clear')
  .description('Clear all data from the database')
  .option('--mongo-uri <uri>', 'MongoDB connection URI', process.env.MONGO_URI || 'mongodb://localhost:27017/aerosuite')
  .action(async (options) => {
    const spinner = createSpinner('Connecting to database...').start();
    
    try {
      // Connect to MongoDB
      await mongoose.connect(options.mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      spinner.success({ text: 'Connected to database' });
      
      // Create seeder with clear option
      const seeder = new DatabaseSeeder({ clearExisting: true });
      const clearSpinner = createSpinner('Clearing database...').start();
      
      await seeder.clearDatabase();
      
      clearSpinner.success({ text: 'Database cleared successfully' });
      
      // Disconnect from MongoDB
      await mongoose.disconnect();
      console.log(chalk.blue('Disconnected from database'));
      
      process.exit(0);
    } catch (error) {
      spinner.error({ text: 'Error clearing database' });
      console.error(chalk.red('Error:'), error);
      process.exit(1);
    }
  });

// Parse arguments
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 