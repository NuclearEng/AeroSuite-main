/**
 * Simple Express Server
 * 
 * A lightweight server for development purposes
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const app = express();
const PORT = 5002;

// Create HTTP server
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'production' ? undefined : err.message
  });
});

// Routes
app.get('/api/health', (req, res, next) => {
  try {
    res.json({ 
      status: 'ok', 
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  } catch (err) {
    next(err);
  }
});

// Auth routes
app.post('/api/auth/login', (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Mock authentication
    if (email && password) {
      res.json({
        success: true,
        data: {
          user: {
            id: '123',
            email: email,
            name: 'Test User',
            role: 'admin'
          },
          token: 'mock-jwt-token'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
  } catch (err) {
    next(err);
  }
});

// Supplier routes
app.get('/api/suppliers', (req, res, next) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: '1',
          name: 'Aerospace Components Inc.',
          status: 'active',
          rating: 4.5,
          location: 'Seattle, WA',
          contactEmail: 'contact@aerocomponents.com'
        },
        {
          id: '2',
          name: 'Precision Parts Ltd.',
          status: 'active',
          rating: 4.2,
          location: 'Boston, MA',
          contactEmail: 'info@precisionparts.com'
        }
      ]
    });
  } catch (err) {
    next(err);
  }
});

// Inspection routes
app.get('/api/inspections', (req, res, next) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: '1',
          supplierId: '1',
          status: 'completed',
          type: 'quality',
          date: new Date().toISOString(),
          inspector: 'John Doe',
          result: 'passed'
        },
        {
          id: '2',
          supplierId: '2',
          status: 'scheduled',
          type: 'safety',
          date: new Date(Date.now() + 86400000).toISOString(),
          inspector: 'Jane Smith',
          result: 'pending'
        }
      ]
    });
  } catch (err) {
    next(err);
  }
});

// Customer routes
app.get('/api/customers', (req, res, next) => {
  try {
    res.json({
      success: true,
      data: [
        {
          id: '1',
          name: 'Global Airlines',
          status: 'active',
          industry: 'Commercial Aviation',
          location: 'Chicago, IL',
          contactEmail: 'procurement@globalairlines.com'
        },
        {
          id: '2',
          name: 'Space Exploration Technologies',
          status: 'active',
          industry: 'Space',
          location: 'Houston, TX',
          contactEmail: 'suppliers@spacetech.com'
        }
      ]
    });
  } catch (err) {
    next(err);
  }
});

// Handle 404 errors for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.url}`
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
});

// Handle server shutdown gracefully
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

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});