// Task: TS009 - API Core Framework
const express = require('express');
const router = express.Router();
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { validationResult } = require('express-validator');
const compression = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const logger = require('../utils/logger');
const { AppError } = require('../utils/errorHandler');
const cache = require('../utils/cache');

/**
 * API Framework Core
 * Provides standardized API structure with versioning, documentation, and middleware
 */
class ApiFramework {
  constructor() {
    this.app = express();
    this.versions = new Map();
    this.middleware = [];
    this.errorHandlers = [];
    this.routes = new Map();
    
    // Configuration
    this.config = {
      basePath: process.env.API_BASE_PATH || '/api',
      defaultVersion: process.env.API_DEFAULT_VERSION || 'v1',
      enableDocs: process.env.API_ENABLE_DOCS !== 'false',
      enableMetrics: process.env.API_ENABLE_METRICS === 'true',
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      rateLimiting: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
        max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
        standardHeaders: true,
        legacyHeaders: false
      }
    };
    
    // Initialize core middleware
    this.initializeCoreMiddleware();
  }

  /**
   * Initialize core middleware
   */
  initializeCoreMiddleware() {
    // Trust proxy
    this.app.set('trust proxy', true);
    
    // Compression
    this.app.use(compression());
    
    // CORS
    this.app.use(cors({
      origin: (origin, callback) => {
        if (!origin || this.config.corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new AppError('Not allowed by CORS', 403));
        }
      },
      credentials: true,
      optionsSuccessStatus: 200
    }));
    
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: false // We set this separately
    }));
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Data sanitization
    this.app.use(mongoSanitize());
    this.app.use(xss());
    
    // Prevent parameter pollution
    this.app.use(hpp());
    
    // Request ID
    this.app.use((req, res, next) => {
      req.id = req.headers['x-request-id'] || require('crypto').randomUUID();
      res.setHeader('X-Request-ID', req.id);
      next();
    });
    
    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('API Request', {
          requestId: req.id,
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
      });
      
      next();
    });
  }

  /**
   * Register API version
   */
  registerVersion(version, config = {}) {
    const versionConfig = {
      version,
      prefix: `${this.config.basePath}/${version}`,
      router: express.Router(),
      middleware: [],
      rateLimits: new Map(),
      documentation: {
        openapi: '3.0.0',
        info: {
          title: `AeroSuite API ${version.toUpperCase()}`,
          version: '1.0.0',
          description: config.description || `API version ${version}`,
          contact: {
            name: 'API Support',
            email: 'api@aerosuite.com'
          }
        },
        servers: [
          {
            url: `${process.env.API_URL || 'http://localhost:5000'}${this.config.basePath}/${version}`,
            description: 'API Server'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            },
            apiKey: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key'
            }
          }
        },
        security: [
          { bearerAuth: [] },
          { apiKey: [] }
        ],
        paths: {}
      },
      ...config
    };
    
    this.versions.set(version, versionConfig);
    
    // Apply version-specific middleware
    versionConfig.router.use((req, res, next) => {
      req.apiVersion = version;
      next();
    });
    
    return versionConfig;
  }

  /**
   * Define API endpoint
   */
  define(version, endpoint) {
    const versionConfig = this.versions.get(version);
    if (!versionConfig) {
      throw new Error(`API version ${version} not registered`);
    }
    
    const {
      method = 'GET',
      path,
      summary,
      description,
      tags = [],
      middleware = [],
      validation = [],
      rateLimit: endpointRateLimit,
      cache: cacheConfig,
      handler,
      responses = {},
      parameters = [],
      requestBody
    } = endpoint;
    
    // Build middleware chain
    const middlewareChain = [];
    
    // Rate limiting
    if (endpointRateLimit) {
      const limiter = this.createRateLimiter(endpointRateLimit);
      middlewareChain.push(limiter);
    }
    
    // Caching
    if (cacheConfig && method === 'GET') {
      middlewareChain.push(this.createCacheMiddleware(cacheConfig));
    }
    
    // Validation
    if (validation.length > 0) {
      middlewareChain.push(...validation);
      middlewareChain.push(this.validationHandler);
    }
    
    // Custom middleware
    middlewareChain.push(...middleware);
    
    // Handler wrapper
    const wrappedHandler = this.wrapHandler(handler, cacheConfig);
    middlewareChain.push(wrappedHandler);
    
    // Register route
    const routePath = path.replace(/:([^/]+)/g, '{$1}');
    versionConfig.router[method.toLowerCase()](path, ...middlewareChain);
    
    // Update documentation
    if (!versionConfig.documentation.paths[routePath]) {
      versionConfig.documentation.paths[routePath] = {};
    }
    
    versionConfig.documentation.paths[routePath][method.toLowerCase()] = {
      summary,
      description,
      tags,
      operationId: `${method.toLowerCase()}${path.replace(/[^a-zA-Z0-9]/g, '')}`,
      parameters: this.buildSwaggerParameters(parameters),
      requestBody: requestBody ? this.buildSwaggerRequestBody(requestBody) : undefined,
      responses: this.buildSwaggerResponses(responses),
      security: endpoint.security || versionConfig.documentation.security
    };
    
    // Store route metadata
    const routeKey = `${version}:${method}:${path}`;
    this.routes.set(routeKey, {
      version,
      method,
      path,
      endpoint
    });
    
    return this;
  }

  /**
   * Create rate limiter
   */
  createRateLimiter(config) {
    const limiterConfig = {
      windowMs: config.windowMs || this.config.rateLimiting.windowMs,
      max: config.max || this.config.rateLimiting.max,
      message: config.message || 'Too many requests, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: config.keyGenerator || ((req) => {
        return req.user?.id || req.ip;
      }),
      skip: config.skip,
      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          path: req.path,
          userId: req.user?.id
        });
        res.status(429).json({
          error: 'Too Many Requests',
          message: limiterConfig.message,
          retryAfter: Math.ceil(limiterConfig.windowMs / 1000)
        });
      }
    };
    
    return rateLimit(limiterConfig);
  }

  /**
   * Create cache middleware
   */
  createCacheMiddleware(config) {
    return async (req, res, next) => {
      if (config.skip && config.skip(req)) {
        return next();
      }
      
      const cacheKey = config.keyGenerator ? 
        config.keyGenerator(req) : 
        `api:${req.apiVersion}:${req.method}:${req.path}:${JSON.stringify(req.query)}`;
      
      try {
        const cached = await cache.get(cacheKey);
        if (cached) {
          res.setHeader('X-Cache', 'HIT');
          res.setHeader('X-Cache-Key', cacheKey);
          return res.json(cached);
        }
      } catch (error) {
        logger.error('Cache retrieval error:', error);
      }
      
      // Store original send
      const originalSend = res.json.bind(res);
      
      // Override json method
      res.json = function(data) {
        res.setHeader('X-Cache', 'MISS');
        
        // Cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, data, config.ttl || 300).catch(err => {
            logger.error('Cache storage error:', err);
          });
        }
        
        return originalSend(data);
      };
      
      next();
    };
  }

  /**
   * Validation error handler
   */
  validationHandler(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: errors.array().map(err => ({
          field: err.param,
          message: err.msg,
          value: err.value
        }))
      });
    }
    next();
  }

  /**
   * Wrap async handler
   */
  wrapHandler(handler, cacheConfig) {
    return async (req, res, next) => {
      try {
        // Create standardized request object
        const apiRequest = {
          ...req,
          getData: () => ({
            params: req.params,
            query: req.query,
            body: req.body,
            headers: req.headers,
            user: req.user
          })
        };
        
        // Create standardized response object
        const apiResponse = {
          success: (data, meta = {}) => {
            const response = {
              success: true,
              data,
              meta: {
                ...meta,
                timestamp: new Date().toISOString(),
                version: req.apiVersion
              }
            };
            res.json(response);
          },
          
          error: (message, code = 400, details = null) => {
            const response = {
              success: false,
              error: {
                message,
                code,
                details,
                timestamp: new Date().toISOString()
              }
            };
            res.status(code).json(response);
          },
          
          paginated: (data, pagination) => {
            const response = {
              success: true,
              data,
              pagination,
              meta: {
                timestamp: new Date().toISOString(),
                version: req.apiVersion
              }
            };
            res.json(response);
          }
        };
        
        // Execute handler
        await handler(apiRequest, apiResponse, next);
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Build Swagger parameters
   */
  buildSwaggerParameters(parameters) {
    return parameters.map(param => ({
      name: param.name,
      in: param.in || 'query',
      description: param.description,
      required: param.required || false,
      schema: param.schema || { type: 'string' },
      example: param.example
    }));
  }

  /**
   * Build Swagger request body
   */
  buildSwaggerRequestBody(requestBody) {
    return {
      description: requestBody.description,
      required: requestBody.required !== false,
      content: {
        'application/json': {
          schema: requestBody.schema,
          example: requestBody.example
        }
      }
    };
  }

  /**
   * Build Swagger responses
   */
  buildSwaggerResponses(responses) {
    const swaggerResponses = {
      '200': {
        description: 'Successful response',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: true },
                data: responses['200']?.schema || { type: 'object' },
                meta: {
                  type: 'object',
                  properties: {
                    timestamp: { type: 'string', format: 'date-time' },
                    version: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      },
      '400': {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                success: { type: 'boolean', example: false },
                error: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    code: { type: 'number' },
                    details: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      },
      '401': {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      '403': {
        description: 'Forbidden',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      '404': {
        description: 'Not Found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      '429': {
        description: 'Too Many Requests',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      },
      '500': {
        description: 'Internal Server Error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error'
            }
          }
        }
      }
    };
    
    // Merge custom responses
    Object.keys(responses).forEach(code => {
      if (responses[code]) {
        swaggerResponses[code] = {
          description: responses[code].description || swaggerResponses[code]?.description,
          content: {
            'application/json': {
              schema: responses[code].schema || swaggerResponses[code]?.content?.['application/json']?.schema,
              example: responses[code].example
            }
          }
        };
      }
    });
    
    return swaggerResponses;
  }

  /**
   * Mount API to Express app
   */
  mount(app) {
    // Mount each version
    this.versions.forEach((config, version) => {
      // Apply version middleware
      config.middleware.forEach(mw => config.router.use(mw));
      
      // Mount version router
      app.use(config.prefix, config.router);
      
      // Setup documentation
      if (this.config.enableDocs) {
        const docsPath = `${config.prefix}/docs`;
        const specPath = `${config.prefix}/docs/spec`;
        
        // Serve OpenAPI spec
        app.get(specPath, (req, res) => {
          res.json(config.documentation);
        });
        
        // Serve Swagger UI
        app.use(
          docsPath,
          swaggerUi.serve,
          swaggerUi.setup(config.documentation, {
            customCss: '.swagger-ui .topbar { display: none }',
            customSiteTitle: `${config.documentation.info.title} - Documentation`
          })
        );
      }
    });
    
    // API health check
    app.get(`${this.config.basePath}/health`, (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        versions: Array.from(this.versions.keys()),
        uptime: process.uptime()
      });
    });
    
    // API metrics endpoint
    if (this.config.enableMetrics) {
      app.get(`${this.config.basePath}/metrics`, async (req, res) => {
        const metrics = await this.collectMetrics();
        res.json(metrics);
      });
    }
    
    // Version redirect
    app.get(this.config.basePath, (req, res) => {
      res.redirect(`${this.config.basePath}/${this.config.defaultVersion}/docs`);
    });
    
    // 404 handler for API routes
    app.use(`${this.config.basePath}/*`, (req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: 'The requested API endpoint does not exist',
        path: req.path,
        method: req.method
      });
    });
    
    // Error handling
    app.use(this.errorHandler.bind(this));
  }

  /**
   * Global error handler
   */
  errorHandler(err, req, res, next) {
    // Log error
    logger.error('API Error', {
      error: err.message,
      stack: err.stack,
      requestId: req.id,
      path: req.path,
      method: req.method,
      userId: req.user?.id
    });
    
    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Prepare error response
    const response = {
      success: false,
      error: {
        message: err.message || 'Internal Server Error',
        code: err.statusCode || 500
      }
    };
    
    if (isDevelopment) {
      response.error.stack = err.stack;
      response.error.details = err;
    }
    
    // Handle specific error types
    if (err.name === 'ValidationError') {
      response.error.code = 400;
      response.error.message = 'Validation Error';
      response.error.details = Object.keys(err.errors).map(field => ({
        field,
        message: err.errors[field].message
      }));
    } else if (err.name === 'CastError') {
      response.error.code = 400;
      response.error.message = 'Invalid ID format';
    } else if (err.code === 11000) {
      response.error.code = 409;
      response.error.message = 'Duplicate entry';
      const field = Object.keys(err.keyPattern)[0];
      response.error.details = { field, value: err.keyValue[field] };
    }
    
    res.status(response.error.code).json(response);
  }

  /**
   * Collect API metrics
   */
  async collectMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      versions: {}
    };
    
    // Collect metrics for each version
    for (const [version, config] of this.versions) {
      const versionMetrics = {
        endpoints: 0,
        documentation: `${config.prefix}/docs`
      };
      
      // Count endpoints
      this.routes.forEach((route, key) => {
        if (key.startsWith(version)) {
          versionMetrics.endpoints++;
        }
      });
      
      metrics.versions[version] = versionMetrics;
    }
    
    return metrics;
  }

  /**
   * Generate API client SDK
   */
  generateSDK(version, language = 'javascript') {
    const versionConfig = this.versions.get(version);
    if (!versionConfig) {
      throw new Error(`API version ${version} not found`);
    }
    
    // This is a simplified example - in production, you'd use a proper SDK generator
    const sdk = {
      javascript: this.generateJavaScriptSDK(versionConfig),
      typescript: this.generateTypeScriptSDK(versionConfig),
      python: this.generatePythonSDK(versionConfig)
    };
    
    return sdk[language] || sdk.javascript;
  }

  /**
   * Generate JavaScript SDK
   */
  generateJavaScriptSDK(config) {
    let sdk = `// AeroSuite API SDK ${config.version}\n\n`;
    sdk += `class AeroSuiteAPI {\n`;
    sdk += `  constructor(baseURL, apiKey) {\n`;
    sdk += `    this.baseURL = baseURL || '${config.prefix}';\n`;
    sdk += `    this.apiKey = apiKey;\n`;
    sdk += `  }\n\n`;
    
    // Generate methods for each endpoint
    this.routes.forEach((route) => {
      if (route.version === config.version) {
        const methodName = this.generateMethodName(route.method, route.path);
        sdk += `  async ${methodName}(params = {}) {\n`;
        sdk += `    // Implementation for ${route.method} ${route.path}\n`;
        sdk += `  }\n\n`;
      }
    });
    
    sdk += `}\n\n`;
    sdk += `module.exports = AeroSuiteAPI;\n`;
    
    return sdk;
  }

  /**
   * Generate TypeScript SDK
   */
  generateTypeScriptSDK(config) {
    // Similar to JavaScript but with TypeScript types
    return '// TypeScript SDK implementation';
  }

  /**
   * Generate Python SDK
   */
  generatePythonSDK(config) {
    // Python SDK implementation
    return '# Python SDK implementation';
  }

  /**
   * Generate method name from route
   */
  generateMethodName(method, path) {
    const parts = path.split('/').filter(p => p && !p.startsWith(':'));
    const action = method.toLowerCase();
    const resource = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    return `${action}${resource}`;
  }
}

// Create singleton instance
const apiFramework = new ApiFramework();

// Export framework
module.exports = apiFramework; 