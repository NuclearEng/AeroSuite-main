/**
 * TrainingEnvironmentService.js
 * 
 * Service for managing containerized training environments
 * Implements RF053 - Set up containerized training environments
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');
const logger = require('../utils/logger');
const { EventEmitter } = require('events');

// Promisify exec
const execAsync = promisify(exec);

/**
 * Training environment types
 * @enum {string}
 */
const EnvironmentType = {
  TENSORFLOW: 'tensorflow',
  PYTORCH: 'pytorch',
  SCIKIT: 'scikit-learn',
  XGBOOST: 'xgboost',
  CUSTOM: 'custom'
};

/**
 * Training environment status
 * @enum {string}
 */
const EnvironmentStatus = {
  CREATED: 'created',
  STARTING: 'starting',
  RUNNING: 'running',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  ERROR: 'error'
};

/**
 * Training Environment Service
 * Manages containerized environments for ML model training
 */
class TrainingEnvironmentService {
  /**
   * Create a new training environment service
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      environmentsPath: process.env.ML_ENVIRONMENTS_PATH || path.join(__dirname, '../../../..', 'ml-environments'),
      dataPath: process.env.ML_DATA_PATH || path.join(__dirname, '../../../..', 'ml-data'),
      modelsPath: process.env.ML_MODEL_STORAGE_PATH || path.join(__dirname, '../../../..', 'ml-models'),
      dockerNetwork: process.env.DOCKER_NETWORK || 'aerosuite-network',
      resourceLimits: {
        cpus: process.env.TRAINING_ENV_CPU_LIMIT || '2',
        memory: process.env.TRAINING_ENV_MEMORY_LIMIT || '4g',
        gpuCount: process.env.TRAINING_ENV_GPU_COUNT || '0'
      },
      ...options
    };
    
    this.environments = new Map();
    this.eventEmitter = new EventEmitter();
    
    // Initialize service
    this._initialize();
  }
  
  /**
   * Initialize the training environment service
   * @private
   */
  async _initialize() {
    try {
      // Ensure directories exist
      await this._ensureDirectories();
      
      // Check if Docker is available
      await this._checkDockerAvailability();
      
      // Load existing environments
      await this._loadEnvironments();
      
      logger.info('Training Environment Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Training Environment Service', error);
    }
  }
  
  /**
   * Ensure required directories exist
   * @private
   */
  async _ensureDirectories() {
    try {
      await fs.mkdir(this.options.environmentsPath, { recursive: true });
      await fs.mkdir(this.options.dataPath, { recursive: true });
      await fs.mkdir(this.options.modelsPath, { recursive: true });
      
      logger.debug('Required directories created');
    } catch (error) {
      logger.error('Failed to create required directories', error);
      throw error;
    }
  }
  
  /**
   * Check if Docker is available
   * @private
   */
  async _checkDockerAvailability() {
    try {
      const { stdout } = await execAsync('docker --version');
      logger.info(`Docker is available: ${stdout.trim()}`);
      
      // Check if Docker is running
      await execAsync('docker info');
      logger.info('Docker daemon is running');
      
      return true;
    } catch (error) {
      logger.error('Docker is not available or not running', error);
      throw new Error('Docker is required for containerized training environments');
    }
  }
  
  /**
   * Load existing environments from disk
   * @private
   */
  async _loadEnvironments() {
    try {
      const environmentsFile = path.join(this.options.environmentsPath, 'environments.json');
      
      try {
        await fs.access(environmentsFile);
        
        // Read environments file
        const data = await fs.readFile(environmentsFile, 'utf8');
        const environments = JSON.parse(data);
        
        // Load environments into memory
        for (const env of environments) {
          this.environments.set(env.id, {
            ...env,
            status: EnvironmentStatus.STOPPED // Reset status on load
          });
        }
        
        logger.info(`Loaded ${this.environments.size} training environments`);
      } catch (error) {
        // File doesn't exist, create it
        await this._saveEnvironments();
        logger.info('Created new environments file');
      }
    } catch (error) {
      logger.error('Failed to load environments', error);
      throw error;
    }
  }
  
  /**
   * Save environments to disk
   * @private
   */
  async _saveEnvironments() {
    try {
      const environmentsFile = path.join(this.options.environmentsPath, 'environments.json');
      
      // Convert environments map to array
      const environments = Array.from(this.environments.values());
      
      // Write to file
      await fs.writeFile(
        environmentsFile,
        JSON.stringify(environments, null, 2)
      );
      
      logger.debug('Environments saved successfully');
    } catch (error) {
      logger.error('Failed to save environments', error);
      throw error;
    }
  }
  
  /**
   * Create a new training environment
   * @param {string} name - Environment name
   * @param {string} type - Environment type
   * @param {Object} options - Environment options
   * @returns {Promise<Object>} Created environment
   */
  async createEnvironment(name, type, options = {}) {
    try {
      logger.info(`Creating training environment: ${name} (${type})`);
      
      // Validate environment type
      if (!Object.values(EnvironmentType).includes(type)) {
        throw new Error(`Unsupported environment type: ${type}`);
      }
      
      // Generate unique ID
      const id = `env-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Create environment directory
      const envDir = path.join(this.options.environmentsPath, id);
      await fs.mkdir(envDir, { recursive: true });
      
      // Create environment configuration
      const environment = {
        id,
        name,
        type,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: EnvironmentStatus.CREATED,
        options: {
          framework: options.framework || type,
          frameworkVersion: options.frameworkVersion || 'latest',
          pythonVersion: options.pythonVersion || '3.9',
          packages: options.packages || [],
          environmentVariables: options.environmentVariables || {},
          gpuEnabled: options.gpuEnabled || false,
          ...options
        },
        containerName: `aerosuite-training-${id}`,
        imageName: this._getImageName(type, options),
        resourceLimits: {
          ...this.options.resourceLimits,
          ...(options.resourceLimits || {})
        }
      };
      
      // Store environment in memory
      this.environments.set(id, environment);
      
      // Save environments to disk
      await this._saveEnvironments();
      
      // Generate Dockerfile and docker-compose.yml
      await this._generateDockerfiles(environment);
      
      logger.info(`Training environment ${id} created successfully`);
      
      return environment;
    } catch (error) {
      logger.error(`Failed to create training environment: ${name}`, error);
      throw error;
    }
  }
  
  /**
   * Get image name based on environment type and options
   * @param {string} type - Environment type
   * @param {Object} options - Environment options
   * @returns {string} Docker image name
   * @private
   */
  _getImageName(type, options = {}) {
    const { pythonVersion = '3.9', frameworkVersion = 'latest', gpuEnabled = false } = options;
    
    switch (type) {
      case EnvironmentType.TENSORFLOW:
        return gpuEnabled 
          ? `tensorflow/tensorflow:${frameworkVersion}-gpu-py${pythonVersion}`
          : `tensorflow/tensorflow:${frameworkVersion}-py${pythonVersion}`;
      case EnvironmentType.PYTORCH:
        return gpuEnabled
          ? `pytorch/pytorch:${frameworkVersion}-cuda-py${pythonVersion}`
          : `pytorch/pytorch:${frameworkVersion}-py${pythonVersion}`;
      case EnvironmentType.SCIKIT:
        return `python:${pythonVersion}-slim`;
      case EnvironmentType.XGBOOST:
        return `python:${pythonVersion}-slim`;
      case EnvironmentType.CUSTOM:
        return options.baseImage || `python:${pythonVersion}`;
      default:
        return `python:${pythonVersion}`;
    }
  }
  
  /**
   * Generate Dockerfile and docker-compose.yml for an environment
   * @param {Object} environment - Environment configuration
   * @private
   */
  async _generateDockerfiles(environment) {
    try {
      const envDir = path.join(this.options.environmentsPath, environment.id);
      
      // Create Dockerfile
      let dockerfileContent = `FROM ${environment.imageName}\n\n`;
      
      // Set working directory
      dockerfileContent += 'WORKDIR /app\n\n';
      
      // Install additional packages
      if (environment.options.packages && environment.options.packages.length > 0) {
        if (environment.type === EnvironmentType.SCIKIT || environment.type === EnvironmentType.XGBOOST) {
          // For scikit-learn or xgboost, install the framework and additional packages
          dockerfileContent += 'RUN pip install --no-cache-dir ';
          
          if (environment.type === EnvironmentType.SCIKIT) {
            dockerfileContent += `scikit-learn==${environment.options.frameworkVersion || 'latest'} `;
          } else if (environment.type === EnvironmentType.XGBOOST) {
            dockerfileContent += `xgboost==${environment.options.frameworkVersion || 'latest'} `;
          }
          
          dockerfileContent += environment.options.packages.join(' ') + '\n\n';
        } else {
          // For other frameworks, just install additional packages
          dockerfileContent += `RUN pip install --no-cache-dir ${environment.options.packages.join(' ')}\n\n`;
        }
      }
      
      // Copy training code
      dockerfileContent += 'COPY ./code /app/code\n';
      dockerfileContent += 'COPY ./requirements.txt /app/requirements.txt\n\n';
      
      // Install requirements
      dockerfileContent += 'RUN pip install --no-cache-dir -r requirements.txt\n\n';
      
      // Set environment variables
      if (environment.options.environmentVariables && Object.keys(environment.options.environmentVariables).length > 0) {
        for (const [key, value] of Object.entries(environment.options.environmentVariables)) {
          dockerfileContent += `ENV ${key}=${value}\n`;
        }
        dockerfileContent += '\n';
      }
      
      // Set entry point
      dockerfileContent += 'ENTRYPOINT ["python", "/app/code/train.py"]\n';
      
      // Write Dockerfile
      await fs.writeFile(path.join(envDir, 'Dockerfile'), dockerfileContent);
      
      // Create docker-compose.yml
      const composeContent = `version: '3.8'

services:
  training:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${environment.containerName}
    volumes:
      - ${this.options.dataPath}:/app/data
      - ${this.options.modelsPath}:/app/models
    environment:
      - PYTHONUNBUFFERED=1
${this._generateEnvironmentVariables(environment)}
    deploy:
      resources:
        limits:
          cpus: '${environment.resourceLimits.cpus}'
          memory: '${environment.resourceLimits.memory}'
${this._generateGpuConfig(environment)}
    networks:
      - ${this.options.dockerNetwork}

networks:
  ${this.options.dockerNetwork}:
    external: true
`;
      
      // Write docker-compose.yml
      await fs.writeFile(path.join(envDir, 'docker-compose.yml'), composeContent);
      
      // Create directories for code and data
      await fs.mkdir(path.join(envDir, 'code'), { recursive: true });
      
      // Create a basic requirements.txt file
      await fs.writeFile(path.join(envDir, 'requirements.txt'), '# Add your requirements here\n');
      
      // Create a basic training script
      const trainScript = `# Basic training script template
import os
import argparse
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description='Training script')
    parser.add_argument('--data-path', type=str, default='/app/data', help='Path to training data')
    parser.add_argument('--model-path', type=str, default='/app/models', help='Path to save model')
    parser.add_argument('--epochs', type=int, default=10, help='Number of epochs')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    args = parser.parse_args()
    
    logger.info(f"Starting training with {args.epochs} epochs and batch size {args.batch_size}")
    logger.info(f"Data path: {args.data_path}")
    logger.info(f"Model path: {args.model_path}")
    
    # Add your training code here
    # Example:
    # 1. Load data
    # 2. Preprocess data
    # 3. Define model
    # 4. Train model
    # 5. Save model
    
    # Simulate training
    import time
    for epoch in range(args.epochs):
        logger.info(f"Epoch {epoch+1}/{args.epochs}")
        time.sleep(1)  # Simulate training time
    
    # Save a dummy model file
    model_file = os.path.join(args.model_path, 'model.h5')
    with open(model_file, 'w') as f:
        f.write('Dummy model file')
    logger.info(f"Model saved to {model_file}")
    
    logger.info("Training completed successfully")

if __name__ == '__main__':
    main()
`;
      
      // Write training script
      await fs.writeFile(path.join(envDir, 'code', 'train.py'), trainScript);
      
      logger.info(`Generated Dockerfile and docker-compose.yml for environment ${environment.id}`);
    } catch (error) {
      logger.error(`Failed to generate Dockerfiles for environment ${environment.id}`, error);
      throw error;
    }
  }
  
  /**
   * Generate environment variables configuration for docker-compose.yml
   * @param {Object} environment - Environment configuration
   * @returns {string} Environment variables configuration
   * @private
   */
  _generateEnvironmentVariables(environment) {
    if (!environment.options.environmentVariables || Object.keys(environment.options.environmentVariables).length === 0) {
      return '';
    }
    
    let config = '';
    for (const [key, value] of Object.entries(environment.options.environmentVariables)) {
      config += `      - ${key}=${value}\n`;
    }
    
    return config;
  }
  
  /**
   * Generate GPU configuration for docker-compose.yml
   * @param {Object} environment - Environment configuration
   * @returns {string} GPU configuration
   * @private
   */
  _generateGpuConfig(environment) {
    if (!environment.options.gpuEnabled || environment.resourceLimits.gpuCount === '0') {
      return '';
    }
    
    return `    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: ${environment.resourceLimits.gpuCount}
              capabilities: [gpu]`;
  }
  
  /**
   * Start a training environment
   * @param {string} environmentId - Environment ID
   * @param {Object} trainingOptions - Training options
   * @returns {Promise<Object>} Running environment
   */
  async startEnvironment(environmentId, trainingOptions = {}) {
    try {
      logger.info(`Starting training environment: ${environmentId}`);
      
      // Check if environment exists
      if (!this.environments.has(environmentId)) {
        throw new Error(`Environment ${environmentId} not found`);
      }
      
      const environment = this.environments.get(environmentId);
      
      // Update status
      environment.status = EnvironmentStatus.STARTING;
      environment.updatedAt = new Date().toISOString();
      await this._saveEnvironments();
      
      // Get environment directory
      const envDir = path.join(this.options.environmentsPath, environmentId);
      
      // Build and start the container
      try {
        // Build the image
        logger.info(`Building Docker image for environment ${environmentId}`);
        await execAsync(`docker-compose -f ${path.join(envDir, 'docker-compose.yml')} build`);
        
        // Prepare command line arguments
        const cmdArgs = [];
        for (const [key, value] of Object.entries(trainingOptions)) {
          cmdArgs.push(`--${key}=${value}`);
        }
        
        // Start the container with command line arguments
        logger.info(`Starting Docker container for environment ${environmentId}`);
        const command = `docker-compose -f ${path.join(envDir, 'docker-compose.yml')} run --rm training ${cmdArgs.join(' ')}`;
        
        // Start the container in the background
        const childProcess = spawn('sh', ['-c', command], {
          detached: true,
          stdio: ['ignore', 'pipe', 'pipe']
        });
        
        // Store child process
        environment.process = childProcess;
        
        // Handle process output
        childProcess.stdout.on('data', (data) => {
          logger.info(`[${environmentId}] ${data.toString().trim()}`);
        });
        
        childProcess.stderr.on('data', (data) => {
          logger.error(`[${environmentId}] ${data.toString().trim()}`);
        });
        
        // Handle process exit
        childProcess.on('exit', (code) => {
          logger.info(`Training environment ${environmentId} exited with code ${code}`);
          
          // Update status
          if (code === 0) {
            environment.status = EnvironmentStatus.STOPPED;
          } else {
            environment.status = EnvironmentStatus.ERROR;
            environment.error = `Process exited with code ${code}`;
          }
          
          environment.updatedAt = new Date().toISOString();
          this._saveEnvironments();
          
          // Emit event
          this.eventEmitter.emit('environment-stopped', {
            environmentId,
            exitCode: code,
            timestamp: new Date()
          });
        });
        
        // Update status
        environment.status = EnvironmentStatus.RUNNING;
        environment.updatedAt = new Date().toISOString();
        await this._saveEnvironments();
        
        // Emit event
        this.eventEmitter.emit('environment-started', {
          environmentId,
          timestamp: new Date()
        });
        
        logger.info(`Training environment ${environmentId} started successfully`);
        
        return environment;
      } catch (error) {
        // Update status on error
        environment.status = EnvironmentStatus.ERROR;
        environment.error = error.message;
        environment.updatedAt = new Date().toISOString();
        await this._saveEnvironments();
        
        throw error;
      }
    } catch (error) {
      logger.error(`Failed to start training environment ${environmentId}`, error);
      throw error;
    }
  }
  
  /**
   * Stop a training environment
   * @param {string} environmentId - Environment ID
   * @returns {Promise<Object>} Stopped environment
   */
  async stopEnvironment(environmentId) {
    try {
      logger.info(`Stopping training environment: ${environmentId}`);
      
      // Check if environment exists
      if (!this.environments.has(environmentId)) {
        throw new Error(`Environment ${environmentId} not found`);
      }
      
      const environment = this.environments.get(environmentId);
      
      // Check if environment is running
      if (environment.status !== EnvironmentStatus.RUNNING) {
        logger.warn(`Environment ${environmentId} is not running (status: ${environment.status})`);
        return environment;
      }
      
      // Update status
      environment.status = EnvironmentStatus.STOPPING;
      environment.updatedAt = new Date().toISOString();
      await this._saveEnvironments();
      
      // Stop the container
      try {
        // Get environment directory
        const envDir = path.join(this.options.environmentsPath, environmentId);
        
        // Stop the container
        await execAsync(`docker-compose -f ${path.join(envDir, 'docker-compose.yml')} down`);
        
        // Kill the process if it exists
        if (environment.process) {
          environment.process.kill();
          delete environment.process;
        }
        
        // Update status
        environment.status = EnvironmentStatus.STOPPED;
        environment.updatedAt = new Date().toISOString();
        await this._saveEnvironments();
        
        // Emit event
        this.eventEmitter.emit('environment-stopped', {
          environmentId,
          timestamp: new Date()
        });
        
        logger.info(`Training environment ${environmentId} stopped successfully`);
        
        return environment;
      } catch (error) {
        // Update status on error
        environment.status = EnvironmentStatus.ERROR;
        environment.error = error.message;
        environment.updatedAt = new Date().toISOString();
        await this._saveEnvironments();
        
        throw error;
      }
    } catch (error) {
      logger.error(`Failed to stop training environment ${environmentId}`, error);
      throw error;
    }
  }
  
  /**
   * Delete a training environment
   * @param {string} environmentId - Environment ID
   * @returns {Promise<boolean>} True if deleted
   */
  async deleteEnvironment(environmentId) {
    try {
      logger.info(`Deleting training environment: ${environmentId}`);
      
      // Check if environment exists
      if (!this.environments.has(environmentId)) {
        throw new Error(`Environment ${environmentId} not found`);
      }
      
      const environment = this.environments.get(environmentId);
      
      // Stop the environment if it's running
      if (environment.status === EnvironmentStatus.RUNNING) {
        await this.stopEnvironment(environmentId);
      }
      
      // Remove environment from memory
      this.environments.delete(environmentId);
      
      // Save environments to disk
      await this._saveEnvironments();
      
      // Delete environment directory
      const envDir = path.join(this.options.environmentsPath, environmentId);
      await fs.rm(envDir, { recursive: true, force: true });
      
      logger.info(`Training environment ${environmentId} deleted successfully`);
      
      return true;
    } catch (error) {
      logger.error(`Failed to delete training environment ${environmentId}`, error);
      throw error;
    }
  }
  
  /**
   * Get a training environment by ID
   * @param {string} environmentId - Environment ID
   * @returns {Promise<Object>} Environment
   */
  async getEnvironment(environmentId) {
    try {
      // Check if environment exists
      if (!this.environments.has(environmentId)) {
        throw new Error(`Environment ${environmentId} not found`);
      }
      
      return this.environments.get(environmentId);
    } catch (error) {
      logger.error(`Failed to get training environment ${environmentId}`, error);
      throw error;
    }
  }
  
  /**
   * Get all training environments
   * @returns {Promise<Array<Object>>} List of environments
   */
  async getEnvironments() {
    try {
      return Array.from(this.environments.values());
    } catch (error) {
      logger.error('Failed to get training environments', error);
      throw error;
    }
  }
  
  /**
   * Update training code for an environment
   * @param {string} environmentId - Environment ID
   * @param {Object} codeFiles - Map of file paths to content
   * @returns {Promise<Object>} Updated environment
   */
  async updateTrainingCode(environmentId, codeFiles) {
    try {
      logger.info(`Updating training code for environment: ${environmentId}`);
      
      // Check if environment exists
      if (!this.environments.has(environmentId)) {
        throw new Error(`Environment ${environmentId} not found`);
      }
      
      const environment = this.environments.get(environmentId);
      
      // Get environment directory
      const envDir = path.join(this.options.environmentsPath, environmentId);
      const codeDir = path.join(envDir, 'code');
      
      // Ensure code directory exists
      await fs.mkdir(codeDir, { recursive: true });
      
      // Write code files
      for (const [filePath, content] of Object.entries(codeFiles)) {
        const fullPath = path.join(codeDir, filePath);
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        
        // Write file
        await fs.writeFile(fullPath, content);
      }
      
      // Update environment
      environment.updatedAt = new Date().toISOString();
      await this._saveEnvironments();
      
      logger.info(`Training code updated for environment ${environmentId}`);
      
      return environment;
    } catch (error) {
      logger.error(`Failed to update training code for environment ${environmentId}`, error);
      throw error;
    }
  }
  
  /**
   * Update requirements.txt for an environment
   * @param {string} environmentId - Environment ID
   * @param {string} requirements - Requirements content
   * @returns {Promise<Object>} Updated environment
   */
  async updateRequirements(environmentId, requirements) {
    try {
      logger.info(`Updating requirements.txt for environment: ${environmentId}`);
      
      // Check if environment exists
      if (!this.environments.has(environmentId)) {
        throw new Error(`Environment ${environmentId} not found`);
      }
      
      const environment = this.environments.get(environmentId);
      
      // Get environment directory
      const envDir = path.join(this.options.environmentsPath, environmentId);
      
      // Write requirements.txt
      await fs.writeFile(path.join(envDir, 'requirements.txt'), requirements);
      
      // Update environment
      environment.updatedAt = new Date().toISOString();
      await this._saveEnvironments();
      
      logger.info(`Requirements.txt updated for environment ${environmentId}`);
      
      return environment;
    } catch (error) {
      logger.error(`Failed to update requirements.txt for environment ${environmentId}`, error);
      throw error;
    }
  }
  
  /**
   * Get logs for a training environment
   * @param {string} environmentId - Environment ID
   * @param {Object} options - Options for retrieving logs
   * @returns {Promise<string>} Container logs
   */
  async getEnvironmentLogs(environmentId, options = {}) {
    try {
      logger.info(`Getting logs for environment: ${environmentId}`);
      
      // Check if environment exists
      if (!this.environments.has(environmentId)) {
        throw new Error(`Environment ${environmentId} not found`);
      }
      
      const environment = this.environments.get(environmentId);
      
      // Set default options
      const { tail = 100, follow = false } = options;
      
      // Get logs from Docker
      const command = `docker logs ${follow ? '-f' : ''} --tail ${tail} ${environment.containerName} 2>&1`;
      
      if (follow) {
        // For follow mode, return a child process
        const childProcess = spawn('sh', ['-c', command], {
          stdio: ['ignore', 'pipe', 'pipe']
        });
        
        return childProcess;
      } else {
        // For non-follow mode, return logs as string
        const { stdout } = await execAsync(command);
        return stdout;
      }
    } catch (error) {
      logger.error(`Failed to get logs for environment ${environmentId}`, error);
      throw error;
    }
  }
  
  /**
   * Register for environment events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    this.eventEmitter.on(event, callback);
  }
  
  /**
   * Unregister from environment events
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  off(event, callback) {
    this.eventEmitter.off(event, callback);
  }
}

module.exports = {
  TrainingEnvironmentService,
  EnvironmentType,
  EnvironmentStatus
}; 