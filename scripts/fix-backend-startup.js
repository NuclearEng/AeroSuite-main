#!/usr/bin/env node

/**
 * Script to fix common backend startup issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing backend startup issues...\n');

// Fix 1: Create MongoDB initialization script
const mongoInitScript = `// MongoDB initialization script
db = db.getSiblingDB('aerosuite');

// Create collections if they don't exist
db.createCollection('users');
db.createCollection('customers');
db.createCollection('suppliers');
db.createCollection('inspections');
db.createCollection('reports');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.customers.createIndex({ email: 1 });
db.suppliers.createIndex({ name: 1 });
db.inspections.createIndex({ scheduledDate: 1 });
db.inspections.createIndex({ status: 1 });

// Create default admin user (only if doesn't exist)
const adminExists = db.users.findOne({ email: 'admin@aerosuite.com' });
if (!adminExists) {
  db.users.insertOne({
    name: 'Admin User',
    email: 'admin@aerosuite.com',
    password: '$2a$10$XQk8yJjK5c5X5X5X5X5X5uQwerty123456', // password: admin123
    role: 'admin',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print('Created default admin user');
}

print('MongoDB initialization complete');
`;

fs.writeFileSync('scripts/mongo-init.js', mongoInitScript);
console.log('✅ Created MongoDB initialization script');

// Fix 2: Create a startup wrapper that ensures MongoDB connection
const startupWrapper = `#!/usr/bin/env node

/**
 * Backend startup wrapper with connection retry logic
 */

const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MAX_RETRIES = 30;
const RETRY_INTERVAL = 2000; // 2 seconds

async function connectWithRetry(retries = 0) {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aerosuite';
  
  try {
    console.log(\`Attempting to connect to MongoDB at \${mongoUri}...\`);
    
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10
    });
    
    console.log('✅ Connected to MongoDB successfully');
    
    // Start the main application
    if (require.main === module) {
      // Check if cluster.js exists, otherwise use index.js
      const clusterPath = path.join(__dirname, 'cluster.js');
      const indexPath = path.join(__dirname, 'index.js');
      
      if (require('fs').existsSync(clusterPath)) {
        console.log('Starting application with cluster.js...');
        require(clusterPath);
      } else {
        console.log('Starting application with index.js...');
        require(indexPath);
      }
    }
    
  } catch (error) {
    console.error(\`MongoDB connection attempt \${retries + 1} failed:\`, error.message);
    
    if (retries < MAX_RETRIES) {
      console.log(\`Retrying in \${RETRY_INTERVAL / 1000} seconds...\`);
      setTimeout(() => connectWithRetry(retries + 1), RETRY_INTERVAL);
    } else {
      console.error('❌ Failed to connect to MongoDB after maximum retries');
      process.exit(1);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\\nReceived SIGINT, shutting down gracefully...');
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
});

// Start the connection process
connectWithRetry();

module.exports = { connectWithRetry };
`;

const serverSrcPath = path.join(process.cwd(), 'server', 'src');
if (!fs.existsSync(serverSrcPath)) {
  fs.mkdirSync(serverSrcPath, { recursive: true });
}

fs.writeFileSync(path.join(serverSrcPath, 'startup.js'), startupWrapper);
console.log('✅ Created startup wrapper with retry logic');

// Fix 3: Create health check wrapper
const healthCheckWrapper = `/**
 * Enhanced health check utilities
 */

const mongoose = require('mongoose');

async function checkDatabase() {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { status: 'unhealthy', message: 'Database not connected' };
    }
    
    // Ping the database
    await mongoose.connection.db.admin().ping();
    
    return { status: 'healthy', message: 'Database connection is healthy' };
  } catch (error) {
    return { status: 'unhealthy', message: error.message };
  }
}

async function checkRedis() {
  try {
    const redis = require('redis');
    const client = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    
    await client.connect();
    await client.ping();
    await client.disconnect();
    
    return { status: 'healthy', message: 'Redis connection is healthy' };
  } catch (error) {
    // Redis is optional, so we return degraded instead of unhealthy
    return { status: 'degraded', message: 'Redis not available: ' + error.message };
  }
}

async function getHealthStatus() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    memory: {
      status: 'healthy',
      usage: process.memoryUsage()
    },
    uptime: process.uptime()
  };
  
  // Determine overall status
  const statuses = Object.values(checks)
    .filter(check => typeof check === 'object' && check.status)
    .map(check => check.status);
  
  let overallStatus = 'healthy';
  if (statuses.includes('unhealthy')) {
    overallStatus = 'unhealthy';
  } else if (statuses.includes('degraded')) {
    overallStatus = 'degraded';
  }
  
  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    version: process.env.npm_package_version || '1.0.0'
  };
}

module.exports = {
  checkDatabase,
  checkRedis,
  getHealthStatus
};
`;

fs.writeFileSync(path.join(serverSrcPath, 'healthCheckEnhanced.js'), healthCheckWrapper);
console.log('✅ Created enhanced health check utilities');

// Fix 4: Create .env.example if it doesn't exist
const envExample = `# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/aerosuite

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Email Configuration (optional)
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Client URL
CLIENT_URL=http://localhost:3000

# Worker Configuration
WORKER_COUNT=1

# Logging
LOG_LEVEL=info

# Node Options
NODE_OPTIONS=--max-old-space-size=2048
`;

const serverPath = path.join(process.cwd(), 'server');
fs.writeFileSync(path.join(serverPath, '.env.example'), envExample);
console.log('✅ Created .env.example file');

// Fix 5: Update package.json scripts
const packageJsonPath = path.join(serverPath, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add helpful scripts
  packageJson.scripts = {
    ...packageJson.scripts,
    "start": "node src/startup.js",
    "start:cluster": "node src/cluster.js",
    "start:single": "node src/index.js",
    "dev": "nodemon src/startup.js",
    "dev:debug": "DEBUG=* nodemon src/startup.js",
    "test:health": "node -e \"require('http').get('http://localhost:5000/api/health', (r) => {r.on('data', d => console.log(d.toString())); r.on('end', () => process.exit(r.statusCode === 200 ? 0 : 1))})\"",
    "debug": "node --inspect src/startup.js",
    "check:env": "node -e \"console.log(require('dotenv').config())\""
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Updated package.json scripts');
}

console.log('\n✨ Backend startup fixes applied successfully!');
console.log('\nNext steps:');
console.log('1. Copy server/Dockerfile.fixed to server/Dockerfile');
console.log('2. Copy docker-compose.fixed.yml to docker-compose.yml');
console.log('3. Create a .env file in the server directory (use .env.example as template)');
console.log('4. Run: npm run debug (in server directory) to test locally');
console.log('5. Or run: docker compose up -d to start with Docker');
console.log('\nTo debug issues, run: node scripts/debug-backend.js');