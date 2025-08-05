# Database Migrations

This document describes the database migration system implemented in the AeroSuite application.

## Overview

The database migration system allows for versioned, controlled changes to the database schema and data. This ensures consistent database structures across all environments and provides a clear history of database changes.

## Features

- **Versioned migrations**: Each migration is timestamped and tracked
- **Forward and backward migrations**: Support for both applying and rolling back changes
- **CLI tool**: Command-line interface for managing migrations
- **API integration**: RESTful API for running migrations from admin interface
- **Automatic migration on startup**: Option to run pending migrations when the server starts

## Migration Architecture

The migration system is built on the `mongoose-migrate-2` library and consists of the following components:

- **Migration CLI** (`src/migrations/cli.js`): Command-line tool for creating and running migrations
- **Migration Config** (`src/migrations/config.js`): Configuration for the migration system
- **Migration Scripts** (`src/migrations/scripts/*.js`): Individual migration files
- **Migration Service** (`src/services/migration.service.js`): Service for programmatically managing migrations
- **Migration API** (`src/routes/admin.routes.js`): REST API endpoints for managing migrations

## Usage

### Command Line Interface

The migration CLI provides the following commands:

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

# Run a specific migration
npm run migrate:up -- --name <migration-name>

# Rollback a specific migration
npm run migrate:down -- --name <migration-name>

# Rollback multiple migrations
npm run migrate:down -- --last <count>
```

### REST API

The migration system exposes the following RESTful endpoints:

- `GET /api/admin/migrations/status`: Get migration status
- `POST /api/admin/migrations/run`: Run all pending migrations
- `POST /api/admin/migrations/run/:name`: Run a specific migration
- `POST /api/admin/migrations/rollback`: Rollback the last migration

All endpoints require admin authentication.

### Automatic Migration on Startup

The server can be configured to automatically run pending migrations during startup by setting the following environment variables:

- `RUN_MIGRATIONS_ON_STARTUP=true`: Enables automatic migrations
- `MIGRATIONS_REQUIRED=true`: If set to true, the server will exit if migrations fail in production

## Creating Migrations

To create a new migration:

```bash
npm run migrate:create add_new_field
```

This creates a timestamped migration file in `src/migrations/scripts/` with the following structure:

```javascript
module.exports = {
  async up(db, client) {
    // Implementation for applying the migration
  },

  async down(db, client) {
    // Implementation for rolling back the migration
  }
};
```

### Migration Best Practices

1. **Idempotency**: Migrations should be idempotent (can be run multiple times without side effects)
2. **Atomicity**: Each migration should be a single, atomic change
3. **Reversibility**: Always implement the `down` method to allow rolling back changes
4. **Small, focused changes**: Keep migrations small and focused on a single change
5. **Test before deploying**: Test migrations in a development environment before deploying to production
6. **Data validation**: Include validation steps in migrations to ensure data integrity

## Example Migrations

### Adding a new field

```javascript
module.exports = {
  async up(db, client) {
    await db.collection('users').updateMany(
      { newField: { $exists: false } },
      { $set: { newField: 'defaultValue' } }
    );
  },

  async down(db, client) {
    await db.collection('users').updateMany(
      {},
      { $unset: { newField: "" } }
    );
  }
};
```

### Creating an index

```javascript
module.exports = {
  async up(db, client) {
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
  },

  async down(db, client) {
    await db.collection('users').dropIndex({ email: 1 });
  }
};
```

### Schema transformation

```javascript
module.exports = {
  async up(db, client) {
    // Get all documents
    const users = await db.collection('users').find({}).toArray();
    
    // Process each document
    for (const user of users) {
      // Transform data
      await db.collection('users').updateOne(
        { _id: user._id },
        { 
          $set: { 
            fullName: `${user.firstName} ${user.lastName}` 
          },
          $unset: {
            firstName: "",
            lastName: ""
          }
        }
      );
    }
  },

  async down(db, client) {
    // Reverse the transformation
    const users = await db.collection('users').find({}).toArray();
    
    for (const user of users) {
      const nameParts = user.fullName.split(' ');
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' ')
          },
          $unset: {
            fullName: ""
          }
        }
      );
    }
  }
};
```

## Troubleshooting

### Common Issues

1. **Migration fails to apply**:
   - Check error logs for specific errors
   - Verify MongoDB connection settings
   - Ensure migration code is valid

2. **Unable to rollback migration**:
   - Verify the `down` method is properly implemented
   - Check if the original state can be restored

3. **Conflicts between migrations**:
   - Review migration order and dependencies
   - Consider combining migrations if they are related

### Recovering from Failed Migrations

If a migration fails and leaves the database in an inconsistent state:

1. Check server logs for error details
2. Manually fix any data inconsistencies
3. Mark the migration as completed or rolled back using the migration API
4. If necessary, create a new migration to fix the issues

## Security Considerations

- Migration commands should only be accessible to administrators
- Sensitive operations should be protected with proper authentication and authorization
- Migration logs should be reviewed for unauthorized access attempts 