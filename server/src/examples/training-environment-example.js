/**
 * training-environment-example.js
 * 
 * Example script demonstrating containerized training environments
 * Implements RF053 - Set up containerized training environments
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../ai/utils/logger');
const { TrainingEnvironmentService, EnvironmentType } = require('../ai/services/TrainingEnvironmentService');

// API base URL
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// API authentication token (for demonstration purposes)
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'demo-token';

// Create axios instance with authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

/**
 * Example of using the training environment service directly
 */
async function runTrainingEnvironmentExample() {
  try {
    logger.info('Starting training environment example');
    
    // Create a training environment service
    const trainingService = new TrainingEnvironmentService();
    
    // Create a TensorFlow training environment
    const tfEnvName = 'example-tensorflow-env-' + Date.now();
    logger.info(`Creating TensorFlow training environment: ${tfEnvName}`);
    
    const tfEnvironment = await trainingService.createEnvironment(tfEnvName, EnvironmentType.TENSORFLOW, {
      frameworkVersion: '2.8.0',
      pythonVersion: '3.9',
      packages: ['pandas', 'matplotlib', 'scikit-learn'],
      environmentVariables: {
        TF_CPP_MIN_LOG_LEVEL: '2',
        PYTHONUNBUFFERED: '1'
      }
    });
    
    logger.info('TensorFlow environment created successfully:', tfEnvironment);
    
    // Create a PyTorch training environment
    const pytorchEnvName = 'example-pytorch-env-' + Date.now();
    logger.info(`Creating PyTorch training environment: ${pytorchEnvName}`);
    
    const pytorchEnvironment = await trainingService.createEnvironment(pytorchEnvName, EnvironmentType.PYTORCH, {
      frameworkVersion: '1.11.0',
      pythonVersion: '3.9',
      packages: ['pandas', 'matplotlib', 'scikit-learn'],
      environmentVariables: {
        PYTHONUNBUFFERED: '1'
      }
    });
    
    logger.info('PyTorch environment created successfully:', pytorchEnvironment);
    
    // Update training code for TensorFlow environment
    logger.info(`Updating training code for environment: ${tfEnvironment.id}`);
    
    // Simple TensorFlow training script
    const tfTrainingCode = `
import tensorflow as tf
import numpy as np
import os
import argparse
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description='TensorFlow training example')
    parser.add_argument('--data-path', type=str, default='/app/data', help='Path to training data')
    parser.add_argument('--model-path', type=str, default='/app/models', help='Path to save model')
    parser.add_argument('--epochs', type=int, default=5, help='Number of epochs')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    args = parser.parse_args()
    
    logger.info(f"Starting TensorFlow training with {args.epochs} epochs and batch size {args.batch_size}")
    
    # Create a simple dataset
    x = np.random.random((1000, 10))
    y = np.random.random((1000, 1))
    
    # Define a simple model
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(64, activation='relu', input_shape=(10,)),
        tf.keras.layers.Dense(32, activation='relu'),
        tf.keras.layers.Dense(1)
    ])
    
    # Compile the model
    model.compile(optimizer='adam', loss='mse', metrics=['mae'])
    
    # Train the model
    for epoch in range(args.epochs):
        logger.info(f"Epoch {epoch+1}/{args.epochs}")
        model.fit(x, y, batch_size=args.batch_size, verbose=1)
    
    # Save the model
    model_path = os.path.join(args.model_path, 'tf_model')
    model.save(model_path)
    logger.info(f"Model saved to {model_path}")
    
    logger.info("Training completed successfully")

if __name__ == '__main__':
    main()
`;
    
    await trainingService.updateTrainingCode(tfEnvironment.id, {
      'train.py': tfTrainingCode
    });
    
    // Update requirements.txt for TensorFlow environment
    const tfRequirements = `
# TensorFlow requirements
numpy>=1.19.2
pandas>=1.3.0
matplotlib>=3.4.0
scikit-learn>=1.0.0
`;
    
    await trainingService.updateRequirements(tfEnvironment.id, tfRequirements);
    
    logger.info('TensorFlow environment training code and requirements updated');
    
    // Update training code for PyTorch environment
    logger.info(`Updating training code for environment: ${pytorchEnvironment.id}`);
    
    // Simple PyTorch training script
    const pytorchTrainingCode = `
import torch
import torch.nn as nn
import torch.optim as optim
import numpy as np
import os
import argparse
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class SimpleModel(nn.Module):
    def __init__(self):
        super(SimpleModel, self).__init__()
        self.layer1 = nn.Linear(10, 64)
        self.layer2 = nn.Linear(64, 32)
        self.layer3 = nn.Linear(32, 1)
        self.relu = nn.ReLU()
        
    def forward(self, x):
        x = self.relu(self.layer1(x))
        x = self.relu(self.layer2(x))
        x = self.layer3(x)
        return x

def main():
    parser = argparse.ArgumentParser(description='PyTorch training example')
    parser.add_argument('--data-path', type=str, default='/app/data', help='Path to training data')
    parser.add_argument('--model-path', type=str, default='/app/models', help='Path to save model')
    parser.add_argument('--epochs', type=int, default=5, help='Number of epochs')
    parser.add_argument('--batch-size', type=int, default=32, help='Batch size')
    args = parser.parse_args()
    
    logger.info(f"Starting PyTorch training with {args.epochs} epochs and batch size {args.batch_size}")
    
    # Create a simple dataset
    x = torch.randn(1000, 10)
    y = torch.randn(1000, 1)
    
    # Create data loader
    dataset = torch.utils.data.TensorDataset(x, y)
    dataloader = torch.utils.data.DataLoader(dataset, batch_size=args.batch_size, shuffle=True)
    
    # Define model
    model = SimpleModel()
    
    # Define loss function and optimizer
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    # Train the model
    for epoch in range(args.epochs):
        logger.info(f"Epoch {epoch+1}/{args.epochs}")
        running_loss = 0.0
        
        for i, data in enumerate(dataloader, 0):
            inputs, labels = data
            
            # Zero the parameter gradients
            optimizer.zero_grad()
            
            # Forward + backward + optimize
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            
        logger.info(f"Loss: {running_loss / len(dataloader)}")
    
    # Save the model
    model_path = os.path.join(args.model_path, 'pytorch_model.pt')
    torch.save(model.state_dict(), model_path)
    logger.info(f"Model saved to {model_path}")
    
    logger.info("Training completed successfully")

if __name__ == '__main__':
    main()
`;
    
    await trainingService.updateTrainingCode(pytorchEnvironment.id, {
      'train.py': pytorchTrainingCode
    });
    
    // Update requirements.txt for PyTorch environment
    const pytorchRequirements = `
# PyTorch requirements
numpy>=1.19.2
pandas>=1.3.0
matplotlib>=3.4.0
scikit-learn>=1.0.0
`;
    
    await trainingService.updateRequirements(pytorchEnvironment.id, pytorchRequirements);
    
    logger.info('PyTorch environment training code and requirements updated');
    
    // Start TensorFlow training environment
    logger.info(`Starting TensorFlow training environment: ${tfEnvironment.id}`);
    
    // Note: In a real example, we would start the environment here
    // For demonstration purposes, we'll skip actually starting the container
    // as it requires Docker to be running
    /*
    const runningTfEnv = await trainingService.startEnvironment(tfEnvironment.id, {
      'epochs': 3,
      'batch-size': 64
    });
    
    logger.info('TensorFlow environment started successfully:', runningTfEnv);
    
    // Wait for a while to let training run
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get logs
    const tfLogs = await trainingService.getEnvironmentLogs(tfEnvironment.id, { tail: 20 });
    logger.info('TensorFlow training logs:', tfLogs);
    
    // Stop TensorFlow environment
    await trainingService.stopEnvironment(tfEnvironment.id);
    logger.info('TensorFlow environment stopped');
    */
    
    // List all environments
    const environments = await trainingService.getEnvironments();
    logger.info(`Found ${environments.length} training environments`);
    
    // Clean up (optional)
    // Uncomment to delete the environments after the example
    // await trainingService.deleteEnvironment(tfEnvironment.id);
    // await trainingService.deleteEnvironment(pytorchEnvironment.id);
    // logger.info('Training environments deleted');
    
    return {
      tfEnvironmentId: tfEnvironment.id,
      pytorchEnvironmentId: pytorchEnvironment.id
    };
  } catch (error) {
    logger.error('Error in training environment example', error);
    throw error;
  }
}

/**
 * Example of using the training environment API
 */
async function runTrainingEnvironmentAPIExample() {
  try {
    logger.info('Starting training environment API example');
    
    // Get available environment types
    const typesResponse = await api.get('/training-environments/types');
    logger.info('Available environment types:', typesResponse.data);
    
    // Create a scikit-learn training environment
    const scikitEnvName = 'api-scikit-env-' + Date.now();
    logger.info(`Creating scikit-learn training environment via API: ${scikitEnvName}`);
    
    const createResponse = await api.post('/training-environments', {
      name: scikitEnvName,
      type: 'scikit-learn',
      options: {
        frameworkVersion: '1.0.2',
        pythonVersion: '3.9',
        packages: ['pandas', 'matplotlib', 'joblib'],
        environmentVariables: {
          PYTHONUNBUFFERED: '1'
        }
      }
    });
    
    const scikitEnvironment = createResponse.data.data;
    logger.info('scikit-learn environment created successfully:', scikitEnvironment);
    
    // Upload training code
    // Note: In a real API example, we would use FormData to upload files
    // For demonstration purposes, we'll simulate this part
    
    // Get all environments
    const environmentsResponse = await api.get('/training-environments');
    logger.info(`Found ${environmentsResponse.data.count} training environments via API`);
    
    // Get environment by ID
    const environmentResponse = await api.get(`/training-environments/${scikitEnvironment.id}`);
    logger.info('Retrieved environment details:', environmentResponse.data);
    
    // Clean up (optional)
    // Uncomment to delete the environment after the example
    // await api.delete(`/training-environments/${scikitEnvironment.id}`);
    // logger.info('Training environment deleted via API');
    
    return {
      scikitEnvironmentId: scikitEnvironment.id
    };
  } catch (error) {
    logger.error('Error in training environment API example', error);
    if (error.response) {
      logger.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Run the examples if this script is executed directly
if (require.main === module) {
  (async () => {
    try {
      // Run the direct service example
      logger.info('=== Running direct service example ===');
      const serviceResult = await runTrainingEnvironmentExample();
      logger.info('Service example completed successfully', serviceResult);
      
      // Run the API example
      logger.info('\n=== Running API example ===');
      const apiResult = await runTrainingEnvironmentAPIExample();
      logger.info('API example completed successfully', apiResult);
      
      process.exit(0);
    } catch (error) {
      logger.error('Example script failed', error);
      process.exit(1);
    }
  })();
} else {
  // Export for use as a module
  module.exports = {
    runTrainingEnvironmentExample,
    runTrainingEnvironmentAPIExample
  };
} 