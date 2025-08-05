/**
 * distributed-tracing-example.js
 * 
 * Example usage of distributed tracing
 * Implements RF046 - Add distributed tracing
 */

const express = require('express');
const axios = require('axios');
const { initTracing } = require('../infrastructure/tracing');
const { createTracingMiddleware, traceRoute, traceErrors } = require('../middleware/tracingMiddleware');
const { createSpan } = require('../infrastructure/tracing');
const { patchHttpModules } = require('../infrastructure/tracing/httpTracing');

// Initialize tracing
async function initializeApp() {
  // Start tracing SDK
  await initTracing();
  
  // Patch HTTP modules for outgoing requests
  patchHttpModules();
  
  // Create Express app
  const app = express();
  
  // Apply tracing middleware to all routes
  app.use(createTracingMiddleware());
  
  // Basic route
  app.get('/', (req, res) => {
    res.json({ message: 'Distributed tracing example' });
  });
  
  // Example 1: Simple traced route
  app.get('/api/example',
    traceRoute('example-route'),
    async (req, res) => {
      res.json({ message: 'This route is traced' });
    }
  );
  
  // Example 2: Nested spans
  app.get('/api/nested',
    traceRoute('nested-spans'),
    async (req, res) => {
      // Create a child span for database operation
      await createSpan('database-query', {
        attributes: {
          'db.system': 'mongodb',
          'db.operation': 'find',
          'db.collection': 'users'
        }
      }, async (span) => {
        // Simulate database query
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Add result attributes
        span.setAttributes({
          'db.mongodb.result_count': 5
        });
      });
      
      // Create another child span for processing
      await createSpan('data-processing', {
        attributes: {
          'processing.type': 'transformation'
        }
      }, async (span) => {
        // Simulate processing
        await new Promise(resolve => setTimeout(resolve, 30));
      });
      
      res.json({ message: 'Nested spans example' });
    }
  );
  
  // Example 3: Error tracing
  app.get('/api/error',
    traceRoute('error-example'),
    async (req, res, next) => {
      try {
        // Simulate an error
        throw new Error('Example error for tracing');
      } catch (error) {
        next(error);
      }
    }
  );
  
  // Example 4: HTTP client tracing
  app.get('/api/http-client',
    traceRoute('http-client-example'),
    async (req, res) => {
      try {
        // Make HTTP request to external service
        const response = await axios.get('https://jsonplaceholder.typicode.com/todos/1');
        res.json({ message: 'HTTP client tracing', data: response.data });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  );
  
  // Example 5: Multiple services trace
  app.get('/api/multi-service',
    traceRoute('multi-service-example'),
    async (req, res) => {
      // Simulate calling multiple services
      await createSpan('auth-service.validateUser', {
        attributes: {
          'service.name': 'auth-service'
        }
      }, async (span) => {
        // Simulate auth service call
        await new Promise(resolve => setTimeout(resolve, 20));
      });
      
      await createSpan('product-service.getProducts', {
        attributes: {
          'service.name': 'product-service'
        }
      }, async (span) => {
        // Simulate product service call
        await new Promise(resolve => setTimeout(resolve, 30));
        
        // Create nested span for database query
        await createSpan('product-service.database.query', {
          attributes: {
            'db.system': 'mongodb',
            'db.operation': 'find',
            'db.collection': 'products'
          }
        }, async (dbSpan) => {
          // Simulate database query
          await new Promise(resolve => setTimeout(resolve, 25));
        });
      });
      
      res.json({ message: 'Multi-service tracing example' });
    }
  );
  
  // Example 6: Async operations
  app.get('/api/async',
    traceRoute('async-operations-example'),
    async (req, res) => {
      // Start multiple async operations
      const promises = [];
      
      // Async operation 1
      promises.push(createSpan('async-operation-1', {}, async (span) => {
        await new Promise(resolve => setTimeout(resolve, 40));
        return { id: 1, status: 'completed' };
      }));
      
      // Async operation 2
      promises.push(createSpan('async-operation-2', {}, async (span) => {
        await new Promise(resolve => setTimeout(resolve, 60));
        return { id: 2, status: 'completed' };
      }));
      
      // Wait for all operations to complete
      const results = await Promise.all(promises);
      
      res.json({ message: 'Async operations tracing', results });
    }
  );
  
  // Add error tracing middleware
  app.use(traceErrors());
  
  // Error handler
  app.use((err, req, res, next) => {
    res.status(500).json({ error: err.message });
  });
  
  // Start server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Distributed tracing example running on port ${PORT}`);
    console.log(`Try accessing these endpoints to see tracing in action:`);
    console.log(`- http://localhost:${PORT}/api/example (Simple traced route)`);
    console.log(`- http://localhost:${PORT}/api/nested (Nested spans)`);
    console.log(`- http://localhost:${PORT}/api/error (Error tracing)`);
    console.log(`- http://localhost:${PORT}/api/http-client (HTTP client tracing)`);
    console.log(`- http://localhost:${PORT}/api/multi-service (Multi-service trace)`);
    console.log(`- http://localhost:${PORT}/api/async (Async operations)`);
    console.log(`\nTraces are being exported to the console in development mode`);
    console.log(`In production, traces would be sent to Jaeger at the configured endpoint`);
  });
  
  return app;
}

// Start the application
if (require.main === module) {
  initializeApp().catch(error => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

module.exports = { initializeApp }; 