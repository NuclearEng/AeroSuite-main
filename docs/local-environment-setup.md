# Local Environment Setup Guide

This guide explains how to set up a local development environment for AeroSuite using the test data generation system.

## Overview

The local environment setup script creates a fully functional development environment with:

1. Generated test data in MongoDB
2. Environment configuration files
3. Docker Compose configuration
4. Documentation

## Prerequisites

- Node.js 14+ installed
- MongoDB installed locally or Docker for containerized setup
- Redis installed locally or Docker for containerized setup

## Quick Start

To set up a basic development environment:

```bash
# Install dependencies
npm install

# Run the setup script
node scripts/setup-local-environment.js
```

This will:
- Create a local-env directory with configuration files
- Generate test data based on the "dev" profile
- Set up environment files for both backend and frontend

## Configuration Options

The setup script supports various options:

| Option | Description | Default |
|--------|-------------|---------|
| `--profile=NAME` | Environment profile (dev, demo, full) | dev |
| `--seed=STRING` | Seed for reproducible data generation | local-dev |
| `--output=PATH` | Output directory for config files | ./local-env |
| `--mongo=URI` | MongoDB URI | mongodb://localhost:27017/aerosuite-dev |
| `--setup-db` | Set up the database with test data | true |
| `--env-file` | Generate .env file with configuration | true |
| `--reset` | Reset existing environment before setup | false |
| `--help` | Show help message | - |

## Data Profiles

Three predefined data profiles are available:

1. **dev** - Small dataset suitable for development (10-20 entities of each type)
2. **demo** - Medium dataset with realistic demo data (50-100 entities of each type)
3. **full** - Large dataset with comprehensive test data (200+ entities of each type)

Example:
```bash
# Set up a demo environment
node scripts/setup-local-environment.js --profile=demo

# Set up a full test environment with specific seed
node scripts/setup-local-environment.js --profile=full --seed=full-test-2025
```

## Docker Setup

If Docker is detected on your system, the script will generate a Docker Compose file for running the necessary services:

```bash
# Navigate to the output directory
cd local-env

# Start the services
docker-compose -f docker-compose.local.yml up -d
```

This will start:
- MongoDB database
- Redis server
- MailHog (for email testing)

## Manual Setup

If you prefer to set up the services manually:

1. **MongoDB**:
   ```bash
   # Start MongoDB locally
   mongod --dbpath=/path/to/data/db
   ```

2. **Redis**:
   ```bash
   # Start Redis locally
   redis-server
   ```

3. **Backend**:
   ```bash
   # Start the backend server
   cd server
   npm install
   npm run dev
   ```

4. **Frontend**:
   ```bash
   # Start the frontend
   cd client
   npm install
   npm start
   ```

## Test Data

The generated test data includes:

- Users with different roles
- Customers with contact information
- Suppliers with performance metrics
- Inspections with checklists
- Products with specifications
- Defects with severity levels

### Default User Accounts

You can log in with these default accounts:

- Admin: admin@aerosuite.test / Password123!
- Manager: manager@aerosuite.test / Password123!
- Inspector: inspector@aerosuite.test / Password123!
- User: user@aerosuite.test / Password123!

## Resetting the Environment

If you need to reset your local environment:

```bash
# Reset and regenerate with the same profile
node scripts/setup-local-environment.js --reset

# Reset and switch to a different profile
node scripts/setup-local-environment.js --profile=demo --reset
```

## Debugging

If you encounter issues:

1. Check MongoDB connection:
   ```bash
   mongosh mongodb://localhost:27017/aerosuite-dev
   ```

2. Verify environment files:
   ```bash
   cat local-env/.env.local
   cat client/.env.local
   ```

3. Check generated data:
   ```bash
   ls -la local-env/data/
   ```

## Further Customization

The test data generator can be customized by modifying:

- Profiles in the setup script
- The TestDataGenerator class (`server/src/utils/testDataGenerator.js`)

For more details on customizing test data, see [Test Data Generation](./test-data-generation.md). 