const { migrate } = require('mongoose-migrate-2');
const config = require('../migrations/config');
const logger = require('../infrastructure/logger');

/**
 * Migration Service
 * 
 * Provides methods to programmatically manage database migrations
 */
class MigrationService {
  /**
   * Run all pending migrations
   * @returns {Promise<{migrationsRun: number}>} Number of migrations that were run
   */
  async runPendingMigrations() {
    try {
      logger.info('Running pending database migrations');
      const migrator = await migrate.create(config);
      const result = await migrator.runAsCLI();
      
      logger.info(`Successfully ran ${result.migrationsRun} migration(s)`);
      return result;
    } catch (error) {
      logger.error('Failed to run migrations:', error);
      throw new Error(`Migration failure: ${error.message}`);
    }
  }

  /**
   * Run a specific migration
   * @param {string} migrationName - Name of the migration to run
   * @returns {Promise<void>}
   */
  async runMigration(migrationName) {
    try {
      logger.info(`Running migration: ${migrationName}`);
      const migrator = await migrate.create(config);
      await migrator.run(migrationName);
      
      logger.info(`Successfully ran migration: ${migrationName}`);
    } catch (error) {
      logger.error(`Failed to run migration ${migrationName}:`, error);
      throw new Error(`Migration failure: ${error.message}`);
    }
  }

  /**
   * Rollback the last applied migration
   * @returns {Promise<number>} Number of migrations rolled back
   */
  async rollbackLastMigration() {
    try {
      logger.info('Rolling back last database migration');
      const migrator = await migrate.create(config);
      const result = await migrator.undoLastAsCLI();
      
      logger.info(`Successfully rolled back ${result} migration(s)`);
      return result;
    } catch (error) {
      logger.error('Failed to rollback migration:', error);
      throw new Error(`Rollback failure: ${error.message}`);
    }
  }

  /**
   * Get migration status
   * @returns {Promise<{completed: Array, pending: Array}>} Lists of completed and pending migrations
   */
  async getMigrationStatus() {
    try {
      const migrator = await migrate.create(config);
      
      const completed = await migrator.getCompletedMigrations();
      const pending = await migrator.getPendingMigrations();
      
      return {
        completed,
        pending
      };
    } catch (error) {
      logger.error('Failed to get migration status:', error);
      throw new Error(`Migration status failure: ${error.message}`);
    }
  }
}

module.exports = new MigrationService(); 