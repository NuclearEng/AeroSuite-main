/**
 * API Documentation Service
 * 
 * This service generates and manages API documentation based on OpenAPI specifications.
 * It provides utilities for dynamically generating documentation for different API versions,
 * resources, and endpoints.
 * 
 * Implements RF019 - Create comprehensive API documentation
 */

const fs = require('fs');
const path = require('path');
const YAML = require('yaml');
const { 
  API_VERSIONS, 
  getAllVersions, 
  getActiveVersions 
} = require('../config/apiVersions');
const apiVersioningService = require('./apiVersioning.service');
const logger = require('../infrastructure/logger');

class ApiDocumentationService {
  constructor() {
    this.baseSpecPath = path.join(__dirname, '../docs/openapi.yaml');
    this.outputDir = path.join(__dirname, '../docs/generated');
    this.specs = {};
    this.templates = {};
    
    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Load base specification
    try {
      const specFile = fs.readFileSync(this.baseSpecPath, 'utf8');
      this.baseSpec = YAML.parse(specFile);
      
      logger.info('Loaded base OpenAPI specification');
    } catch (error) {
      logger.error(`Failed to load OpenAPI specification: ${error.message}`, error);
      this.baseSpec = {
        openapi: '3.0.0',
        info: {
          title: 'AeroSuite API',
          version: '1.0.0'
        },
        paths: {}
      };
    }
    
    // Load documentation templates
    this.loadTemplates();
  }
  
  /**
   * Load documentation templates from the templates directory
   */
  loadTemplates() {
    const templatesDir = path.join(__dirname, '../docs/templates');
    
    // If templates directory doesn't exist, create it
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      logger.info('Created templates directory');
      return;
    }
    
    try {
      const files = fs.readdirSync(templatesDir);
      
      files.forEach(file => {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const templateName = path.basename(file, path.extname(file));
          const templateContent = fs.readFileSync(path.join(templatesDir, file), 'utf8');
          
          this.templates[templateName] = YAML.parse(templateContent);
          logger.info(`Loaded template: ${templateName}`);
        }
      });
    } catch (error) {
      logger.error(`Failed to load templates: ${error.message}`, error);
    }
  }
  
  /**
   * Generate OpenAPI specifications for all API versions
   */
  generateAllSpecs() {
    const versions = getAllVersions();
    
    versions.forEach(version => {
      this.generateSpecForVersion(version);
    });
    
    return this.specs;
  }
  
  /**
   * Generate OpenAPI specification for a specific API version
   * @param {string} version - API version
   * @returns {Object} - OpenAPI specification
   */
  generateSpecForVersion(version) {
    if (!API_VERSIONS[version]) {
      logger.warn(`API version ${version} not found`);
      return null;
    }
    
    // Clone the base specification
    const spec = JSON.parse(JSON.stringify(this.baseSpec));
    
    // Update version-specific information
    spec.info.title = `AeroSuite API ${version.toUpperCase()}`;
    spec.info.version = version;
    
    // Set the server URL
    spec.servers = [
      {
        url: API_VERSIONS[version].basePath,
        description: `AeroSuite API ${version}`
      }
    ];
    
    // Add version lifecycle information
    const lifecycle = apiVersioningService.getVersionLifecycle(version);
    spec.info.description = `${spec.info.description || ''}\n\n## Version Information\n\n`;
    spec.info.description += `- Status: ${lifecycle.status}\n`;
    spec.info.description += `- Release Date: ${API_VERSIONS[version].releaseDate.toISOString().split('T')[0]}\n`;
    
    if (lifecycle.deprecationDate) {
      spec.info.description += `- Deprecation Date: ${lifecycle.deprecationDate.toISOString().split('T')[0]}\n`;
    }
    
    if (lifecycle.sunsetDate) {
      spec.info.description += `- Sunset Date: ${lifecycle.sunsetDate.toISOString().split('T')[0]}\n`;
    }
    
    // Add feature information
    const features = apiVersioningService.getVersionFeatures(version);
    if (features.length > 0) {
      spec.info.description += `\n## Supported Features\n\n`;
      features.forEach(feature => {
        spec.info.description += `- ${feature}\n`;
      });
    }
    
    // Filter paths based on version compatibility
    this.filterPathsByVersion(spec, version);
    
    // Store the generated spec
    this.specs[version] = spec;
    
    // Write the spec to disk
    this.writeSpecToFile(version, spec);
    
    return spec;
  }
  
  /**
   * Filter API paths based on version compatibility
   * @param {Object} spec - OpenAPI specification
   * @param {string} version - API version
   */
  filterPathsByVersion(spec, version) {
    // If there are no paths, nothing to filter
    if (!spec.paths) {
      return;
    }
    
    const versionNumber = parseInt(version.replace('v', ''), 10);
    const filteredPaths = {};
    
    // Iterate through all paths
    Object.entries(spec.paths).forEach(([path, pathItem]) => {
      // Check if the path has a version tag
      const minVersion = this.getMinVersionFromPath(pathItem);
      
      if (minVersion && parseInt(minVersion.replace('v', ''), 10) > versionNumber) {
        // Skip this path if it requires a higher version
        return;
      }
      
      // Include the path with operations supported by this version
      const filteredPathItem = {};
      
      // Filter operations (GET, POST, etc.)
      Object.entries(pathItem).forEach(([method, operation]) => {
        if (method.startsWith('x-') || method === 'parameters') {
          // Copy metadata and parameters as is
          filteredPathItem[method] = operation;
          return;
        }
        
        // Check if the operation has a version tag
        const opMinVersion = this.getMinVersionFromOperation(operation);
        
        if (opMinVersion && parseInt(opMinVersion.replace('v', ''), 10) > versionNumber) {
          // Skip this operation if it requires a higher version
          return;
        }
        
        // Include the operation
        filteredPathItem[method] = operation;
      });
      
      // Only include the path if it has at least one operation
      if (Object.keys(filteredPathItem).some(key => !key.startsWith('x-') && key !== 'parameters')) {
        filteredPaths[path] = filteredPathItem;
      }
    });
    
    // Replace paths with filtered paths
    spec.paths = filteredPaths;
  }
  
  /**
   * Get minimum version from path item
   * @param {Object} pathItem - OpenAPI path item
   * @returns {string|null} - Minimum version or null
   */
  getMinVersionFromPath(pathItem) {
    // Check for x-min-version extension
    if (pathItem['x-min-version']) {
      return pathItem['x-min-version'];
    }
    
    return null;
  }
  
  /**
   * Get minimum version from operation
   * @param {Object} operation - OpenAPI operation
   * @returns {string|null} - Minimum version or null
   */
  getMinVersionFromOperation(operation) {
    // Check for x-min-version extension
    if (operation['x-min-version']) {
      return operation['x-min-version'];
    }
    
    return null;
  }
  
  /**
   * Write OpenAPI specification to file
   * @param {string} version - API version
   * @param {Object} spec - OpenAPI specification
   */
  writeSpecToFile(version, spec) {
    const outputPath = path.join(this.outputDir, `openapi-${version}.yaml`);
    const outputPathJson = path.join(this.outputDir, `openapi-${version}.json`);
    
    try {
      // Write YAML version
      fs.writeFileSync(outputPath, YAML.stringify(spec));
      
      // Write JSON version
      fs.writeFileSync(outputPathJson, JSON.stringify(spec, null, 2));
      
      logger.info(`Generated OpenAPI specification for ${version}`);
    } catch (error) {
      logger.error(`Failed to write OpenAPI specification for ${version}: ${error.message}`, error);
    }
  }
  
  /**
   * Get OpenAPI specification for a specific version
   * @param {string} version - API version
   * @returns {Object} - OpenAPI specification
   */
  getSpec(version) {
    // If spec is not generated yet, generate it
    if (!this.specs[version]) {
      return this.generateSpecForVersion(version);
    }
    
    return this.specs[version];
  }
  
  /**
   * Get all generated OpenAPI specifications
   * @returns {Object} - Map of version to OpenAPI specification
   */
  getAllSpecs() {
    // Generate specs for all versions if not already generated
    if (Object.keys(this.specs).length === 0) {
      return this.generateAllSpecs();
    }
    
    return this.specs;
  }
  
  /**
   * Add a new endpoint to the API documentation
   * @param {string} path - API path
   * @param {string} method - HTTP method
   * @param {Object} operation - OpenAPI operation object
   * @param {string} minVersion - Minimum API version that supports this endpoint
   */
  addEndpoint(path, method, operation, minVersion = 'v1') {
    // Ensure paths object exists
    if (!this.baseSpec.paths) {
      this.baseSpec.paths = {};
    }
    
    // Ensure path exists
    if (!this.baseSpec.paths[path]) {
      this.baseSpec.paths[path] = {};
    }
    
    // Add minimum version metadata
    operation['x-min-version'] = minVersion;
    
    // Add the operation to the path
    this.baseSpec.paths[path][method.toLowerCase()] = operation;
    
    // Regenerate specs
    this.generateAllSpecs();
    
    logger.info(`Added endpoint ${method.toUpperCase()} ${path} to API documentation`);
  }
  
  /**
   * Add a schema to the API documentation
   * @param {string} name - Schema name
   * @param {Object} schema - OpenAPI schema object
   */
  addSchema(name, schema) {
    // Ensure components object exists
    if (!this.baseSpec.components) {
      this.baseSpec.components = {};
    }
    
    // Ensure schemas object exists
    if (!this.baseSpec.components.schemas) {
      this.baseSpec.components.schemas = {};
    }
    
    // Add the schema
    this.baseSpec.components.schemas[name] = schema;
    
    // Regenerate specs
    this.generateAllSpecs();
    
    logger.info(`Added schema ${name} to API documentation`);
  }
  
  /**
   * Save the base OpenAPI specification to file
   */
  saveBaseSpec() {
    try {
      fs.writeFileSync(this.baseSpecPath, YAML.stringify(this.baseSpec));
      logger.info('Saved base OpenAPI specification');
    } catch (error) {
      logger.error(`Failed to save base OpenAPI specification: ${error.message}`, error);
    }
  }
  
  /**
   * Generate documentation for a specific resource
   * @param {string} resource - Resource name
   * @param {Object} options - Documentation options
   * @returns {Object} - Generated documentation
   */
  generateResourceDocs(resource, options = {}) {
    // Check if template exists
    if (!this.templates[resource]) {
      logger.warn(`No template found for resource: ${resource}`);
      return null;
    }
    
    const template = this.templates[resource];
    const docs = JSON.parse(JSON.stringify(template));
    
    // Apply options
    if (options.basePath) {
      // Update paths
      if (docs.paths) {
        const newPaths = {};
        Object.entries(docs.paths).forEach(([path, pathItem]) => {
          newPaths[`${options.basePath}${path}`] = pathItem;
        });
        docs.paths = newPaths;
      }
    }
    
    // Apply version-specific modifications
    if (options.version) {
      // Add version tags
      if (docs.paths) {
        Object.values(docs.paths).forEach(pathItem => {
          Object.values(pathItem).forEach(operation => {
            if (typeof operation === 'object' && operation !== null) {
              operation['x-min-version'] = options.version;
            }
          });
        });
      }
    }
    
    return docs;
  }
  
  /**
   * Merge resource documentation into the base specification
   * @param {string} resource - Resource name
   * @param {Object} options - Documentation options
   */
  mergeResourceDocs(resource, options = {}) {
    const resourceDocs = this.generateResourceDocs(resource, options);
    
    if (!resourceDocs) {
      return;
    }
    
    // Merge paths
    if (resourceDocs.paths) {
      if (!this.baseSpec.paths) {
        this.baseSpec.paths = {};
      }
      
      Object.entries(resourceDocs.paths).forEach(([path, pathItem]) => {
        this.baseSpec.paths[path] = pathItem;
      });
    }
    
    // Merge components
    if (resourceDocs.components) {
      if (!this.baseSpec.components) {
        this.baseSpec.components = {};
      }
      
      // Merge schemas
      if (resourceDocs.components.schemas) {
        if (!this.baseSpec.components.schemas) {
          this.baseSpec.components.schemas = {};
        }
        
        Object.entries(resourceDocs.components.schemas).forEach(([name, schema]) => {
          this.baseSpec.components.schemas[name] = schema;
        });
      }
      
      // Merge other component types (parameters, responses, etc.)
      ['parameters', 'responses', 'examples', 'requestBodies', 'headers', 'securitySchemes', 'links', 'callbacks'].forEach(componentType => {
        if (resourceDocs.components[componentType]) {
          if (!this.baseSpec.components[componentType]) {
            this.baseSpec.components[componentType] = {};
          }
          
          Object.entries(resourceDocs.components[componentType]).forEach(([name, component]) => {
            this.baseSpec.components[componentType][name] = component;
          });
        }
      });
    }
    
    // Regenerate specs
    this.generateAllSpecs();
    
    logger.info(`Merged documentation for resource: ${resource}`);
  }
}

module.exports = new ApiDocumentationService(); 