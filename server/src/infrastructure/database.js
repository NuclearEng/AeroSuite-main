/**
 * database.js
 * 
 * MongoDB database connection module
 */

const mongoose = require('mongoose');

// Default configuration
const defaultConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/aerosuite',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10
  }
};

// Connection state
let isConnected = false;
let isConnecting = false;
let connectionPromise = null;

/**
 * Connect to MongoDB
 * @param {Object} config - Connection configuration
 * @returns {Promise} - Connection promise
 */
function connect(config = {}) {
  const { uri, options } = { ...defaultConfig, ...config };
  
  if (isConnected) {
    return Promise.resolve(mongoose.connection);
  }
  
  if (isConnecting) {
    return connectionPromise;
  }
  
  isConnecting = true;
  
  // Configure mongoose
  mongoose.set('strictQuery', false);
  
  // Create connection promise
  connectionPromise = mongoose.connect(uri, options)
    .then(connection => {
      isConnected = true;
      isConnecting = false;
      console.log('Connected to MongoDB');
      return connection;
    })
    .catch(error => {
      isConnecting = false;
      console.error('MongoDB connection error:', error);
      throw error;
    });
  
  // Handle connection events
  mongoose.connection.on('error', error => {
    console.error('MongoDB connection error:', error);
  });
  
  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
    isConnected = false;
  });
  
  mongoose.connection.on('reconnected', () => {
    console.log('MongoDB reconnected');
    isConnected = true;
  });
  
  // Handle process termination
  process.on('SIGINT', async () => {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to application termination');
      process.exit(0);
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
      process.exit(1);
    }
  });
  
  return connectionPromise;
}

/**
 * Disconnect from MongoDB
 * @returns {Promise} - Disconnection promise
 */
function disconnect() {
  if (!isConnected) {
    return Promise.resolve();
  }
  
  return mongoose.connection.close()
    .then(() => {
      isConnected = false;
      console.log('Disconnected from MongoDB');
    })
    .catch(error => {
      console.error('Error disconnecting from MongoDB:', error);
      throw error;
    });
}

/**
 * Get connection status
 * @returns {boolean} - True if connected
 */
function isConnectedToDatabase() {
  return isConnected;
}

/**
 * Get mongoose connection
 * @returns {Object} - Mongoose connection
 */
function getConnection() {
  return mongoose.connection;
}

/**
 * Get mongoose instance
 * @returns {Object} - Mongoose instance
 */
function getMongoose() {
  return mongoose;
}

module.exports = {
  connect,
  disconnect,
  isConnected: isConnectedToDatabase,
  getConnection,
  getMongoose,
  mongoose
}; 