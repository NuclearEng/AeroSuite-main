/**
 * Swagger UI middleware for API documentation
 * 
 * Enhanced to use the API documentation service for generating
 * comprehensive and version-specific API documentation.
 * 
 * Implements RF019 - Create comprehensive API documentation
 */
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');
const express = require('express');
const logger = require('../utils/logger');
const apiDocumentationService = require('../services/apiDocumentation.service');
const { API_VERSIONS, getAllVersions, getActiveVersions } = require('../config/apiVersions');
const { ApiResponse } = require('../utils/apiContract');

/**
 * SwaggerDocsMiddleware class
 * Loads OpenAPI specification and serves Swagger UI
 */
class SwaggerDocsMiddleware {
  constructor(options = {}) {
    this.options = {
      specPath: options.specPath || path.join(__dirname, '../docs/openapi.yaml'),
      docsPath: options.docsPath || '/docs',
      customCss: options.customCss || '.swagger-ui .topbar { display: none }',
      apiVersions: options.apiVersions || Object.keys(API_VERSIONS),
      ...options
    };
    
    this.router = express.Router();
    this.specs = {};
    
    this.initialize();
  }
  
  /**
   * Initialize the middleware
   */
  initialize() {
    try {
      // Generate specs for all versions
      this.specs = apiDocumentationService.generateAllSpecs();
      
      // Set up routes
      this.setupRoutes();
      
      logger.info(`Swagger documentation initialized successfully`);
    } catch (error) {
      logger.error(`Failed to initialize Swagger documentation: ${error.message}`, error);
    }
  }
  
  /**
   * Set up documentation routes
   */
  setupRoutes() {
    // Main documentation index
    this.router.get('/', (req, res) => {
      const versions = Object.keys(this.specs)
        .filter(version => API_VERSIONS[version] && API_VERSIONS[version].isActive)
        .map(version => ({
          version,
          url: `/api/docs/${version}`,
          description: API_VERSIONS[version].description || '',
          isDefault: API_VERSIONS[version].isDefault || false
        }));
        
      res.json(
        ApiResponse.success(
          {
            title: 'AeroSuite API Documentation',
            versions,
            defaultVersion: versions.find(v => v.isDefault)?.version || versions[0]?.version
          },
          'API Documentation'
        )
      );
    });
    
    // Documentation home page
    this.router.get('/home', (req, res) => {
      res.sendFile(path.join(__dirname, '../docs/api-home.html'));
    });
    
    // API versioning documentation
    this.router.get('/versioning', (req, res) => {
      res.sendFile(path.join(__dirname, '../docs/api-versioning.md'));
    });
    
    // API contracts documentation
    this.router.get('/contracts', (req, res) => {
      res.sendFile(path.join(__dirname, '../docs/api-contracts.md'));
    });
    
    // Versioned documentation
    Object.keys(this.specs).forEach(version => {
      if (!API_VERSIONS[version] || !API_VERSIONS[version].isActive) {
        return;
      }
      
      // JSON spec
      this.router.get(`/${version}/docs.json`, (req, res) => {
        res.json(this.specs[version]);
      });
      
      // YAML spec
      this.router.get(`/${version}/docs.yaml`, (req, res) => {
        res.setHeader('Content-Type', 'text/yaml');
        res.send(YAML.stringify(this.specs[version]));
      });
      
      // Swagger UI
      this.router.use(`/${version}`, swaggerUi.serve);
      this.router.get(`/${version}`, swaggerUi.setup(this.specs[version], {
        customCss: this.options.customCss,
        swaggerOptions: {
          docExpansion: 'none',
          persistAuthorization: true,
          tagsSorter: 'alpha',
          operationsSorter: 'alpha',
          defaultModelsExpandDepth: 1,
          defaultModelExpandDepth: 1
        }
      }));
      
      // Resource-specific documentation
      this.router.get(`/${version}/resources/:resource`, (req, res) => {
        const { resource } = req.params;
        const resourcePaths = {};
        
        // Extract paths related to this resource
        if (this.specs[version] && this.specs[version].paths) {
          Object.entries(this.specs[version].paths).forEach(([path, pathItem]) => {
            // Check if path contains resource name
            if (path.includes(`/${resource}/`) || path.includes(`/${resource}s/`)) {
              resourcePaths[path] = pathItem;
            }
          });
        }
        
        if (Object.keys(resourcePaths).length === 0) {
          return res.status(404).json(
            ApiResponse.error(
              `No documentation found for resource: ${resource}`,
              'RESOURCE_NOT_FOUND'
            )
          );
        }
        
        // Create a filtered spec for this resource
        const resourceSpec = JSON.parse(JSON.stringify(this.specs[version]));
        resourceSpec.paths = resourcePaths;
        
        res.json(
          ApiResponse.success(
            {
              resource,
              version,
              spec: resourceSpec
            },
            `Documentation for ${resource} resource`
          )
        );
      });
    });
    
    // API reference documentation
    this.router.get('/reference', (req, res) => {
      const reference = {
        resources: [],
        schemas: []
      };
      
      // Get the default version spec
      const defaultVersion = Object.keys(API_VERSIONS).find(v => API_VERSIONS[v].isDefault);
      const spec = this.specs[defaultVersion || Object.keys(this.specs)[0]];
      
      if (spec && spec.paths) {
        // Extract resources from paths
        const resources = new Set();
        
        Object.keys(spec.paths).forEach(path => {
          const parts = path.split('/').filter(p => p);
          if (parts.length > 0) {
            resources.add(parts[0]);
          }
        });
        
        reference.resources = Array.from(resources).map(resource => ({
          name: resource,
          url: `/api/docs/${defaultVersion}/resources/${resource}`
        }));
      }
      
      if (spec && spec.components && spec.components.schemas) {
        // Extract schemas
        reference.schemas = Object.keys(spec.components.schemas).map(schema => ({
          name: schema,
          url: `/api/docs/${defaultVersion}#/components/schemas/${schema}`
        }));
      }
      
      res.json(
        ApiResponse.success(
          reference,
          'API Reference'
        )
      );
    });
    
    // Regenerate documentation
    this.router.post('/regenerate', (req, res) => {
      try {
        // Regenerate specs
        this.specs = apiDocumentationService.generateAllSpecs();
        
        res.json(
          ApiResponse.success(
            {
              message: 'Documentation regenerated successfully',
              versions: Object.keys(this.specs)
            },
            'Documentation Regenerated'
          )
        );
      } catch (error) {
        logger.error(`Failed to regenerate documentation: ${error.message}`, error);
        
        res.status(500).json(
          ApiResponse.error(
            `Failed to regenerate documentation: ${error.message}`,
            'REGENERATION_FAILED'
          )
        );
      }
    });
  }
  
  /**
   * Get the middleware router
   */
  getRouter() {
    return this.router;
  }
}

module.exports = SwaggerDocsMiddleware; 