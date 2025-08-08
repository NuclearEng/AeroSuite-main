/**
 * API Proxy Server (Non-privileged port version)
 * 
 * This proxy forwards requests from localhost:3000/api to the appropriate local server
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const fs = require('fs');

// Create log directory if it doesn't exist
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Redirect console output to file
const logFile = fs.createWriteStream('logs/api-proxy-3000.log', { flags: 'a' });
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(message) {
  const timestamp = new Date().toISOString();
  logFile.write(`[${timestamp}] ${message}\n`);
  originalConsoleLog(`[${timestamp}] ${message}`);
};

console.error = function(message) {
  const timestamp = new Date().toISOString();
  logFile.write(`[${timestamp}] ERROR: ${message}\n`);
  originalConsoleError(`[${timestamp}] ERROR: ${message}`);
};

const app = express();
const PORT = 3001;

// Middleware: restrict CORS to allowed origins
const allowedOrigins = (process.env.PROXY_ALLOWED_ORIGINS || 'http://localhost:3000').split(',').map(o => o.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true
}));

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - Original URL: ${req.originalUrl}`);
  next();
});

// Proxy middleware options
const options = {
  target: 'http://localhost:5002',
  changeOrigin: true,
  // Don't rewrite paths - pass them as-is
  pathRewrite: false,
  // Let CORS middleware manage headers
  onError: (err, req, res) => {
    console.error(`Proxy error: ${err.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Proxy error',
      error: err.message
    });
  }
};

// Create the proxy
const apiProxy = createProxyMiddleware(options);

// Use the proxy for all /api routes
app.use('/api', apiProxy);

// Default route for health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API Proxy is running',
    timestamp: new Date().toISOString()
  });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`API Proxy running on port ${PORT}`);
  console.log(`Forwarding requests to http://localhost:5002`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
