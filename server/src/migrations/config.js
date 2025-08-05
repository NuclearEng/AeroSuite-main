const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

/**
 * Migration Configuration
 */
module.exports = {
  // MongoDB connection options
  mongodb: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/aerosuite',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // Migration options
  migrationsDir: path.resolve(__dirname, 'scripts'),
  changelogCollectionName: 'migrations',
  migrationFileExtension: '.js',
  useFileHash: true,
  
  // Get Mongoose instance (useful when migration needs to use Mongoose models)
  getMongooseInstance: () => mongoose
}; 