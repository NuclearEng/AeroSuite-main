# Automated Database Migrations

This directory contains the automated database migration system for AeroSuite.

## Overview

The automated database migration system provides tools for:

1. Creating and running migrations
2. Detecting schema changes and generating migration templates
3. Monitoring migration status and sending notifications
4. Automating migration execution during deployment

## Directory Structure

- `cli.js` - Command-line interface for managing migrations
- `config.js` - Configuration for the migration system
- `scripts/` - Migration script files
- `../scripts/generate-migration.js` - Script to detect schema changes and generate migration templates
- `../scripts/monitor-migrations.js` - Script to monitor migration status and send notifications
- `../scripts/deploy-with-migrations.js` - Script to run migrations during deployment
- `../scripts/migration-crontab.txt` - Crontab configuration for automated tasks

## Usage

### Command-Line Interface

```bash
# Create a new migration
npm run migrate:create <name>

# Run all pending migrations
npm run migrate:up

# Rollback the most recent migration
npm run migrate:down

# Check migration status
npm run migrate:status

# List all migrations and their status
npm run migrate:list
```

### Automated Tools

```bash
# Generate migration templates based on schema changes
npm run migrate:generate

# Monitor migration status and send notifications
npm run migrate:monitor

# Deploy with automatic migrations
npm run deploy:with-migrations
```

## Automation Features

### Schema Change Detection

The `generate-migration.js` script analyzes Mongoose models and compares them to the database schema. It detects:

- New collections
- Missing fields in existing collections
- Deprecated fields in existing collections
- Missing indexes

When changes are detected, it generates a migration template that can be reviewed and applied.

### Migration Monitoring

The `monitor-migrations.js` script checks for pending migrations and sends notifications via email if any are found. It also logs migration status to the monitoring system.

### Deployment Integration

The `deploy-with-migrations.js` script runs pending migrations during deployment, ensuring the database schema is up to date before the application starts.

### Scheduled Tasks

The `migration-crontab.txt` file contains crontab entries for automating:

- Daily schema change detection and migration generation
- Regular migration status monitoring
- Automatic migration execution in development
- Log rotation

## Best Practices

1. **Review Generated Migrations**: Always review automatically generated migrations before applying them.
2. **Test Migrations**: Test migrations in a development environment before applying them to production.
3. **Include Rollback Logic**: Always implement the `down` method to allow rolling back changes.
4. **Keep Migrations Small**: Each migration should make a small, focused change.
5. **Backup Before Migrating**: Always back up the database before running migrations in production.
6. **Monitor Migration Status**: Regularly check for pending migrations to ensure the database schema is up to date.

## Configuration

The migration system can be configured through environment variables:

- `MONGODB_URI` - MongoDB connection string
- `RUN_MIGRATIONS_ON_STARTUP` - Whether to run migrations on application startup
- `MIGRATIONS_REQUIRED` - Whether to exit if migrations fail in production
- `NOTIFICATION_EMAIL` - Email address for migration notifications
- `SMTP_HOST`, `SMTP_PORT`, etc. - SMTP configuration for email notifications
- `ENABLE_MONITORING` - Whether to log migration status to the monitoring system

## Troubleshooting

If you encounter issues with migrations:

1. Check the migration logs in `/var/log/aerosuite/migrations-*.log`
2. Run `npm run migrate:status` to see the current migration status
3. Check the MongoDB connection settings in `.env`
4. Verify that the migration scripts are valid JavaScript

For more information, see the full documentation in `server/docs/database-migrations.md`. 
