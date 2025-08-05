/**
 * Simple Express Server
 * 
 * A lightweight server for development purposes
 */

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Auth routes
app.post('/api/auth/login', (req, res) => {
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
});

// Supplier routes
app.get('/api/suppliers', (req, res) => {
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
});

// Inspection routes
app.get('/api/inspections', (req, res) => {
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
});

// Customer routes
app.get('/api/customers', (req, res) => {
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
});

// Start the server
app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
}); 