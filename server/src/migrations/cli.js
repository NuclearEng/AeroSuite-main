#!/usr/bin/env node

/**
 * AeroSuite Database Migration CLI
 * 
 * This CLI tool manages database migrations for the AeroSuite application.
 * It allows creating, running, and rolling back migrations.
 */

const { program } = require('commander');
const path = require('path');
const fs = require('fs');
const { migrate } = require('mongoose-migrate-2');
const config = require('./config');

// Configure the CLI
program
  .name('migrate')
  .description('AeroSuite database migration tool')
  .version('1.0.0');

/**
 * Create a new migration file
 */
program
  .command('create <name>')
  .description('Create a new migration script')
  .action(async (name) => {
    try {
      // Create a timestamp for the migration name
      const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
      const fileName = `${timestamp}_${name}.js`;
      const filePath = path.join(config.migrationsDir, fileName);
      
      // Create migration template
      const template = `/**
 * Migration: ${name}
 * Created at: ${new Date().toISOString()}
 */
module.exports = {
  /**
   * Run the migration
   * @param {Object} db - MongoDB client
   * @param {Object} client - MongoDB native client
   * @returns {Promise<void>}
   */
  async up(db, client) {
    // TODO: Implement migration
    // Example:
    // await db.collection('users').updateMany({}, { $set: { isActive: true } });
  },

  /**
   * Reverse the migration
   * @param {Object} db - MongoDB client
   * @param {Object} client - MongoDB native client
   * @returns {Promise<void>}
   */
  async down(db, client) {
    // TODO: Implement rollback
    // Example:
    // await db.collection('users').updateMany({}, { $unset: { isActive: 1 } });
  }
};
`;
      
      // Write the file
      fs.writeFileSync(filePath, template);
      console.log(`Migration file created: ${filePath}`);
    } catch (error) {
      console.error('Failed to create migration:', error);
      process.exit(1);
    }
  });

/**
 * Run migrations
 */
program
  .command('up')
  .description('Run all pending migrations')
  .option('-n, --name <name>', 'Run specific migration by name')
  .action(async (options) => {
    try {
      console.log('Running migrations...');
      
      const migrator = await migrate.create(config);
      
      if (options.name) {
        // Run specific migration
        await migrator.run(options.name);
        console.log(`Migration ${options.name} completed successfully.`);
      } else {
        // Run all pending migrations
        const { migrationsRun } = await migrator.runAsCLI();
        
        if (migrationsRun === 0) {
          console.log('No pending migrations to run.');
        } else {
          console.log(`Successfully ran ${migrationsRun} migration(s).`);
        }
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
  });

/**
 * Rollback migrations
 */
program
  .command('down')
  .description('Rollback migrations')
  .option('-n, --name <name>', 'Rollback specific migration by name')
  .option('-a, --all', 'Rollback all migrations')
  .option('-l, --last <count>', 'Rollback last N migrations')
  .action(async (options) => {
    try {
      console.log('Rolling back migrations...');
      
      const migrator = await migrate.create(config);
      
      if (options.name) {
        // Rollback specific migration
        await migrator.undo(options.name);
        console.log(`Migration ${options.name} rolled back successfully.`);
      } else if (options.all) {
        // Rollback all migrations
        const migrations = await migrator.getCompletedMigrations();
        for (const migration of migrations) {
          await migrator.undo(migration.name);
        }
        console.log(`Successfully rolled back ${migrations.length} migration(s).`);
      } else if (options.last) {
        // Rollback last N migrations
        const count = parseInt(options.last, 10);
        const migrations = await migrator.getCompletedMigrations();
        const migrationsToRollback = migrations.slice(-count);
        
        for (const migration of migrationsToRollback) {
          await migrator.undo(migration.name);
        }
        
        console.log(`Successfully rolled back ${migrationsToRollback.length} migration(s).`);
      } else {
        // Default: rollback last migration
        const undoneCount = await migrator.undoLastAsCLI();
        
        if (undoneCount === 0) {
          console.log('No migrations to rollback.');
        } else {
          console.log(`Successfully rolled back ${undoneCount} migration(s).`);
        }
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Rollback failed:', error);
      process.exit(1);
    }
  });

/**
 * List migrations
 */
program
  .command('list')
  .description('List all migrations and their status')
  .action(async () => {
    try {
      const migrator = await migrate.create(config);
      
      // Get completed and pending migrations
      const completedMigrations = await migrator.getCompletedMigrations();
      const pendingMigrations = await migrator.getPendingMigrations();
      
      console.log('\nMigration Status:');
      console.log('=================');
      
      // Display completed migrations
      console.log('\nCompleted Migrations:');
      if (completedMigrations.length === 0) {
        console.log('  No completed migrations.');
      } else {
        completedMigrations.forEach(migration => {
          console.log(`  ✓ ${migration.name} (applied at: ${new Date(migration.appliedAt).toLocaleString()})`);
        });
      }
      
      // Display pending migrations
      console.log('\nPending Migrations:');
      if (pendingMigrations.length === 0) {
        console.log('  No pending migrations.');
      } else {
        pendingMigrations.forEach(migration => {
          console.log(`  ○ ${migration.name}`);
        });
      }
      
      console.log('\n');
      process.exit(0);
    } catch (error) {
      console.error('Failed to list migrations:', error);
      process.exit(1);
    }
  });

/**
 * Check migration status
 */
program
  .command('status')
  .description('Show migration status')
  .action(async () => {
    try {
      const migrator = await migrate.create(config);
      
      // Get completed and pending migrations count
      const completedMigrations = await migrator.getCompletedMigrations();
      const pendingMigrations = await migrator.getPendingMigrations();
      
      console.log('\nMigration Status:');
      console.log(`- Completed: ${completedMigrations.length}`);
      console.log(`- Pending: ${pendingMigrations.length}`);
      
      if (pendingMigrations.length > 0) {
        console.log('\nPending migrations:');
        pendingMigrations.forEach(migration => {
          console.log(`  - ${migration.name}`);
        });
      }
      
      process.exit(0);
    } catch (error) {
      console.error('Failed to check migration status:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv); 