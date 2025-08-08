// Task: AI001 - AI/ML Core Framework
const tf = require('@tensorflow/tfjs-node');
const natural = require('natural');
const brain = require('brain.js');
const mlpipeline = require('ml-pipeline');
const EventEmitter = require('events');
const logger = require('../../utils/logger');
const cache = require('../../utils/cache');
const { performance } = require('perf_hooks');

/**
 * AI/ML Core Framework
 * Provides unified interface for various AI/ML models and operations
 */
class AIFramework extends EventEmitter {
  constructor() {
    super();
    
    this.models = new Map();
    this.pipelines = new Map();
    this.preprocessors = new Map();
    this.postprocessors = new Map();
    this.activeJobs = new Map();
    
    this.config = {
      maxConcurrentJobs: parseInt(process.env.AI_MAX_CONCURRENT_JOBS) || 5,
      modelCachePath: process.env.AI_MODEL_CACHE_PATH || './ai-models',
      enableGPU: process.env.AI_ENABLE_GPU === 'true',
      batchSize: parseInt(process.env.AI_BATCH_SIZE) || 32,
      enableAutoML: process.env.AI_ENABLE_AUTOML === 'true',
      performanceThreshold: parseInt(process.env.AI_PERF_THRESHOLD) || 1000
    };
    
    this.metrics = {
      totalPredictions: 0,
      totalTrainingJobs: 0,
      averageInferenceTime: 0,
      modelAccuracies: new Map()
    };
    
    // Initialize TensorFlow
    this.initializeTensorFlow();
    
    // Initialize NLP tools
    this.initializeNLP();

    // Register defect detection pipeline (AI001)
    this.createPipeline('defect-detection-pipeline', [
      {
        name: 'Preprocess Image',
        type: 'preprocess',
        operation: 'normalize',
        params: { targetSize: [640, 640], channels: 3 }
      },
      {
        name: 'Defect Detection Inference',
        type: 'predict',
        modelId: 'defect-detection',
        options: { threshold: 0.5 }
      },
      {
        name: 'Postprocess Results',
        type: 'custom',
        execute: async (data, options) => {
          // Example: format bounding boxes, filter by confidence
          if (!data || !data.predictions) return data;
          return {
            ...data,
            predictions: data.predictions.filter(p => p.confidence >= (options.threshold || 0.5))
          };
        }
      }
    ]);
  }

  /**
   * Initialize TensorFlow configuration
   */
  async initializeTensorFlow() {
    try {
      // Set backend
      if (this.config.enableGPU && tf.engine().backendName !== 'tensorflow-gpu') {
        await tf.setBackend('tensorflow-gpu');
      }
      
      // Configure memory management
      tf.engine().startScope();
      
      logger.info('TensorFlow initialized', {
        backend: tf.engine().backendName,
        version: tf.version.tfjs
      });
    } catch (error) {
      logger.error('Failed to initialize TensorFlow:', error);
    }
  }

  /**
   * Initialize NLP tools
   */
  initializeNLP() {
    // Tokenizers
    this.tokenizers = {
      word: new natural.WordTokenizer(),
      treebank: new natural.TreebankWordTokenizer(),
      regex: new natural.RegexpTokenizer({ pattern: /\s+/ })
    };
    
    // Stemmers
    this.stemmers = {
      porter: natural.PorterStemmer,
      lancaster: natural.LancasterStemmer
    };
    
    // Sentiment analyzer
    this.sentimentAnalyzer = new natural.SentimentAnalyzer('English', 
      natural.PorterStemmer, 'afinn');
    
    // TF-IDF
    this.tfidf = new natural.TfIdf();
    
    logger.info('NLP tools initialized');
  }

  /**
   * Register a model
   */
  async registerModel(modelId, modelConfig) {
    try {
      const model = {
        id: modelId,
        type: modelConfig.type,
        version: modelConfig.version || '1.0.0',
        config: modelConfig,
        status: 'loading',
        metrics: {
          predictions: 0,
          totalInferenceTime: 0,
          accuracy: null,
          lastUsed: null
        }
      };
      
      // Load model based on type
      switch (modelConfig.type) {
        case 'tensorflow':
          model.instance = await this.loadTensorFlowModel(modelConfig);
          break;
        case 'brain':
          model.instance = await this.loadBrainJSModel(modelConfig);
          break;
        case 'custom':
          model.instance = await this.loadCustomModel(modelConfig);
          break;
        default:
          throw new Error(`Unsupported model type: ${modelConfig.type}`);
      }
      
      model.status = 'ready';
      this.models.set(modelId, model);
      
      this.emit('model:registered', { modelId, config: modelConfig });
      logger.info(`Model registered: ${modelId}`);
      
      return model;
    } catch (error) {
      logger.error(`Failed to register model ${modelId}:`, error);
      throw error;
    }
  }

  /**
   * Load TensorFlow model
   */
  async loadTensorFlowModel(config) {
    if (config.modelPath) {
      // Load pre-trained model
      return await tf.loadLayersModel(`file://${config.modelPath}/model.json`);
    } else if (config.architecture) {
      // Build model from architecture
      return this.buildTensorFlowModel(config.architecture);
    } else {
      throw new Error('Model path or architecture required');
    }
  }

  /**
   * Build TensorFlow model from architecture
   */
  buildTensorFlowModel(architecture) {
    const model = tf.sequential();
    
    architecture.layers.forEach((layerConfig, index) => {
      const { type, ...params } = layerConfig;
      
      // Add input shape to first layer
      if (index === 0 && architecture.inputShape) {
        params.inputShape = architecture.inputShape;
      }
      
      // Add layer based on type
      switch (type) {
        case 'dense':
          model.add(tf.layers.dense(params));
          break;
        case 'conv2d':
          model.add(tf.layers.conv2d(params));
          break;
        case 'maxPooling2d':
          model.add(tf.layers.maxPooling2d(params));
          break;
        case 'dropout':
          model.add(tf.layers.dropout(params));
          break;
        case 'flatten':
          model.add(tf.layers.flatten(params));
          break;
        case 'lstm':
          model.add(tf.layers.lstm(params));
          break;
        case 'gru':
          model.add(tf.layers.gru(params));
          break;
        case 'batchNormalization':
          model.add(tf.layers.batchNormalization(params));
          break;
        default:
          throw new Error(`Unsupported layer type: ${type}`);
      }
    });
    
    // Compile model
    model.compile({
      optimizer: architecture.optimizer || 'adam',
      loss: architecture.loss || 'categoricalCrossentropy',
      metrics: architecture.metrics || ['accuracy']
    });
    
    return model;
  }

  /**
   * Load Brain.js model
   */
  async loadBrainJSModel(config) {
    const ModelClass = brain[config.modelClass] || brain.NeuralNetwork;
    const net = new ModelClass(config.options || {});
    
    if (config.trainedData) {
      net.fromJSON(config.trainedData);
    }
    
    return net;
  }

  /**
   * Load custom model
   */
  async loadCustomModel(config) {
    if (config.loader && typeof config.loader === 'function') {
      return await config.loader();
    }
    throw new Error('Custom model loader function required');
  }

  /**
   * Make prediction
   */
  async predict(modelId, input, options = {}) {
    const startTime = performance.now();
    
    try {
      const model = this.models.get(modelId);
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }
      
      if (model.status !== 'ready') {
        throw new Error(`Model not ready: ${modelId}`);
      }
      
      // Preprocess input
      const preprocessed = await this.preprocessInput(modelId, input, options);
      
      // Make prediction based on model type
      let prediction;
      switch (model.type) {
        case 'tensorflow':
          prediction = await this.predictTensorFlow(model.instance, preprocessed);
          break;
        case 'brain':
          prediction = await this.predictBrainJS(model.instance, preprocessed);
          break;
        case 'custom':
          prediction = await model.instance.predict(preprocessed);
          break;
        default:
          throw new Error(`Unsupported model type: ${model.type}`);
      }
      
      // Postprocess prediction
      const result = await this.postprocessPrediction(modelId, prediction, options);
      
      // Update metrics
      const inferenceTime = performance.now() - startTime;
      this.updateModelMetrics(modelId, inferenceTime);
      
      // Cache result if enabled
      if (options.cache) {
        await this.cachePrediction(modelId, input, result, options.cacheTTL);
      }
      
      this.emit('prediction:complete', {
        modelId,
        input,
        result,
        inferenceTime
      });
      
      return result;
    } catch (error) {
      logger.error(`Prediction failed for model ${modelId}:`, error);
      this.emit('prediction:error', { modelId, error });
      throw error;
    }
  }

  /**
   * Predict with TensorFlow model
   */
  async predictTensorFlow(model, input) {
    const inputTensor = tf.tensor(input);
    const prediction = model.predict(inputTensor);
    const result = await prediction.array();
    
    // Clean up tensors
    inputTensor.dispose();
    prediction.dispose();
    
    return result;
  }

  /**
   * Predict with Brain.js model
   */
  async predictBrainJS(model, input) {
    return model.run(input);
  }

  /**
   * Train model
   */
  async trainModel(modelId, trainingData, options = {}) {
    const jobId = `train_${modelId}_${Date.now()}`;
    
    try {
      const model = this.models.get(modelId);
      if (!model) {
        throw new Error(`Model not found: ${modelId}`);
      }
      
      // Check concurrent jobs limit
      if (this.activeJobs.size >= this.config.maxConcurrentJobs) {
        throw new Error('Maximum concurrent training jobs reached');
      }
      
      // Create training job
      const job = {
        id: jobId,
        modelId,
        status: 'preparing',
        startTime: Date.now(),
        progress: 0,
        metrics: {}
      };
      
      this.activeJobs.set(jobId, job);
      this.emit('training:started', job);
      
      // Prepare training data
      job.status = 'preprocessing';
      const { features, labels, validation } = await this.prepareTrainingData(
        modelId, 
        trainingData, 
        options
      );
      
      // Train based on model type
      job.status = 'training';
      let trainResult;
      
      switch (model.type) {
        case 'tensorflow':
          trainResult = await this.trainTensorFlow(
            model.instance, 
            features, 
            labels, 
            validation,
            options,
            (epoch, logs) => {
              job.progress = (epoch / (options.epochs || 10)) * 100;
              job.metrics = logs;
              this.emit('training:progress', job);
            }
          );
          break;
        case 'brain':
          trainResult = await this.trainBrainJS(
            model.instance,
            trainingData,
            options,
            (status) => {
              job.progress = status.iterations / (options.iterations || 20000) * 100;
              job.metrics = { error: status.error };
              this.emit('training:progress', job);
            }
          );
          break;
        case 'custom':
          trainResult = await model.instance.train(trainingData, options);
          break;
        default:
          throw new Error(`Training not supported for model type: ${model.type}`);
      }
      
      // Update model metrics
      job.status = 'completed';
      job.endTime = Date.now();
      job.result = trainResult;
      
      model.metrics.accuracy = trainResult.accuracy || trainResult.error;
      this.metrics.totalTrainingJobs++;
      
      // Save model if specified
      if (options.save) {
        await this.saveModel(modelId, options.savePath);
      }
      
      this.emit('training:completed', job);
      logger.info(`Training completed for model ${modelId}`, trainResult);
      
      return job;
    } catch (error) {
      logger.error(`Training failed for model ${modelId}:`, error);
      
      const job = this.activeJobs.get(jobId);
      if (job) {
        job.status = 'failed';
        job.error = error.message;
        this.emit('training:failed', job);
      }
      
      throw error;
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Train TensorFlow model
   */
  async trainTensorFlow(model, features, labels, validation, options, onProgress) {
    const config = {
      epochs: options.epochs || 10,
      batchSize: options.batchSize || this.config.batchSize,
      shuffle: options.shuffle !== false,
      validationSplit: options.validationSplit || 0.2,
      callbacks: {
        onEpochEnd: onProgress
      }
    };
    
    if (validation) {
      config.validationData = [validation.features, validation.labels];
    }
    
    const history = await model.fit(features, labels, config);
    
    return {
      accuracy: history.history.acc?.[history.history.acc.length - 1],
      loss: history.history.loss[history.history.loss.length - 1],
      history: history.history
    };
  }

  /**
   * Train Brain.js model
   */
  async trainBrainJS(model, trainingData, options, onProgress) {
    const config = {
      iterations: options.iterations || 20000,
      errorThresh: options.errorThresh || 0.005,
      log: false,
      logPeriod: 100,
      learningRate: options.learningRate || 0.3,
      momentum: options.momentum || 0.1,
      callback: onProgress,
      callbackPeriod: 100
    };
    
    const result = await model.trainAsync(trainingData, config);
    
    return {
      error: result.error,
      iterations: result.iterations
    };
  }

  /**
   * Prepare training data
   */
  async prepareTrainingData(modelId, rawData, options) {
    const model = this.models.get(modelId);
    const preprocessor = this.preprocessors.get(modelId);
    
    if (preprocessor) {
      return await preprocessor(rawData, options);
    }
    
    // Default preprocessing based on model type
    if (model.type === 'tensorflow') {
      // Convert to tensors
      const features = tf.tensor2d(rawData.map(item => item.features));
      const labels = tf.tensor2d(rawData.map(item => item.label));
      
      return { features, labels };
    } else if (model.type === 'brain') {
      // Format for Brain.js
      return rawData.map(item => ({
        input: item.features,
        output: item.label
      }));
    }
    
    return rawData;
  }

  /**
   * Save model
   */
  async saveModel(modelId, savePath) {
    const model = this.models.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    const path = savePath || `${this.config.modelCachePath}/${modelId}`;
    
    switch (model.type) {
      case 'tensorflow':
        await model.instance.save(`file://${path}`);
        break;
      case 'brain': {
        const fs = require('fs').promises;
        await fs.writeFile(
          `${path}/model.json`,
          JSON.stringify(model.instance.toJSON())
        );
        break;
      }
      case 'custom':
        if (model.instance.save) {
          await model.instance.save(path);
        }
        break;
    }
    
    logger.info(`Model saved: ${modelId} to ${path}`);
  }

  /**
   * Create ML pipeline
   */
  createPipeline(pipelineId, steps) {
    const pipeline = {
      id: pipelineId,
      steps: steps.map((step, index) => ({
        ...step,
        index,
        status: 'pending'
      })),
      status: 'created',
      metrics: {
        executions: 0,
        totalTime: 0,
        errors: 0
      }
    };
    
    this.pipelines.set(pipelineId, pipeline);
    
    return pipeline;
  }

  /**
   * Execute pipeline
   */
  async executePipeline(pipelineId, input, options = {}) {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) {
      throw new Error(`Pipeline not found: ${pipelineId}`);
    }
    
    const startTime = performance.now();
    const execution = {
      id: `exec_${pipelineId}_${Date.now()}`,
      pipelineId,
      status: 'running',
      results: [],
      startTime: Date.now()
    };
    
    try {
      let data = input;
      
      for (const step of pipeline.steps) {
        execution.currentStep = step.index;
        
        // Execute step
        switch (step.type) {
          case 'preprocess':
            data = await this.executePreprocessStep(step, data, options);
            break;
          case 'predict':
            data = await this.predict(step.modelId, data, step.options);
            break;
          case 'transform':
            data = await this.executeTransformStep(step, data, options);
            break;
          case 'aggregate':
            data = await this.executeAggregateStep(step, data, options);
            break;
          case 'custom':
            data = await step.execute(data, options);
            break;
          default:
            throw new Error(`Unknown step type: ${step.type}`);
        }
        
        execution.results.push({
          step: step.name,
          output: options.includeIntermediateResults ? data : undefined
        });
      }
      
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.output = data;
      
      // Update pipeline metrics
      const executionTime = performance.now() - startTime;
      pipeline.metrics.executions++;
      pipeline.metrics.totalTime += executionTime;
      
      this.emit('pipeline:completed', execution);
      
      return execution;
    } catch (error) {
      execution.status = 'failed';
      execution.error = error.message;
      pipeline.metrics.errors++;
      
      this.emit('pipeline:failed', execution);
      throw error;
    }
  }

  /**
   * Execute preprocess step
   */
  async executePreprocessStep(step, data, options) {
    if (step.preprocessor) {
      return await step.preprocessor(data, options);
    }
    
    // Built-in preprocessors
    switch (step.operation) {
      case 'normalize':
        return this.normalizeData(data, step.params);
      case 'tokenize':
        return this.tokenizeText(data, step.params);
      case 'vectorize':
        return this.vectorizeData(data, step.params);
      default:
        return data;
    }
  }

  /**
   * Execute transform step
   */
  async executeTransformStep(step, data, options) {
    if (step.transformer) {
      return await step.transformer(data, options);
    }
    
    // Built-in transformers
    switch (step.operation) {
      case 'reshape':
        return this.reshapeData(data, step.params);
      case 'filter':
        return this.filterData(data, step.params);
      case 'map':
        return this.mapData(data, step.params);
      default:
        return data;
    }
  }

  /**
   * Execute aggregate step
   */
  async executeAggregateStep(step, data, options) {
    if (step.aggregator) {
      return await step.aggregator(data, options);
    }
    
    // Built-in aggregators
    switch (step.operation) {
      case 'mean':
        return this.calculateMean(data, step.params);
      case 'ensemble':
        return this.ensemblePredictions(data, step.params);
      case 'vote':
        return this.votingClassifier(data, step.params);
      default:
        return data;
    }
  }

  /**
   * Text analysis
   */
  async analyzeText(text, options = {}) {
    const analysis = {
      tokens: this.tokenizers.word.tokenize(text),
      sentiment: this.sentimentAnalyzer.getSentiment(
        this.tokenizers.word.tokenize(text)
      ),
      entities: await this.extractEntities(text),
      keywords: await this.extractKeywords(text, options.keywordCount || 5)
    };
    
    if (options.includePOS) {
      analysis.pos = new natural.BrillPOSTagger(
        natural.Lexicon,
        natural.RuleSet
      ).tag(analysis.tokens);
    }
    
    return analysis;
  }

  /**
   * Extract named entities
   */
  async extractEntities(text) {
    // Simple entity extraction (can be enhanced with more sophisticated NER)
    const patterns = {
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
      date: /\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g
    };
    
    const entities = {};
    
    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = text.match(pattern);
      if (matches) {
        entities[type] = matches;
      }
    }
    
    return entities;
  }

  /**
   * Extract keywords using TF-IDF
   */
  async extractKeywords(text, count = 5) {
    this.tfidf.addDocument(text);
    
    const terms = [];
    this.tfidf.listTerms(0).forEach((item) => {
      terms.push({
        term: item.term,
        tfidf: item.tfidf
      });
    });
    
    // Sort by TF-IDF score and return top keywords
    return terms
      .sort((a, b) => b.tfidf - a.tfidf)
      .slice(0, count)
      .map(item => item.term);
  }

  /**
   * Data preprocessing utilities
   */
  normalizeData(data, params = {}) {
    const { method = 'minmax', featureRange = [0, 1] } = params;
    
    if (method === 'minmax') {
      const min = Math.min(...data);
      const max = Math.max(...data);
      const range = max - min;
      
      return data.map(value => 
        ((value - min) / range) * (featureRange[1] - featureRange[0]) + featureRange[0]
      );
    } else if (method === 'zscore') {
      const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
      const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
      const stdDev = Math.sqrt(variance);
      
      return data.map(value => (value - mean) / stdDev);
    }
    
    return data;
  }

  /**
   * Tokenize text data
   */
  tokenizeText(data, params = {}) {
    const { type = 'word', lowercase = true } = params;
    const tokenizer = this.tokenizers[type] || this.tokenizers.word;
    
    if (Array.isArray(data)) {
      return data.map(text => {
        const tokens = tokenizer.tokenize(text);
        return lowercase ? tokens.map(t => t.toLowerCase()) : tokens;
      });
    }
    
    const tokens = tokenizer.tokenize(data);
    return lowercase ? tokens.map(t => t.toLowerCase()) : tokens;
  }

  /**
   * Vectorize data
   */
  vectorizeData(data, params = {}) {
    const { method = 'onehot', vocabulary } = params;
    
    if (method === 'onehot') {
      const vocab = vocabulary || [...new Set(data.flat())];
      const vocabIndex = {};
      vocab.forEach((word, index) => {
        vocabIndex[word] = index;
      });
      
      return data.map(tokens => {
        const vector = new Array(vocab.length).fill(0);
        tokens.forEach(token => {
          if (vocabIndex[token] !== undefined) {
            vector[vocabIndex[token]] = 1;
          }
        });
        return vector;
      });
    }
    
    return data;
  }

  /**
   * Update model metrics
   */
  updateModelMetrics(modelId, inferenceTime) {
    const model = this.models.get(modelId);
    if (model) {
      model.metrics.predictions++;
      model.metrics.totalInferenceTime += inferenceTime;
      model.metrics.lastUsed = new Date();
      
      this.metrics.totalPredictions++;
      this.metrics.averageInferenceTime = 
        (this.metrics.averageInferenceTime * (this.metrics.totalPredictions - 1) + inferenceTime) / 
        this.metrics.totalPredictions;
    }
  }

  /**
   * Get framework metrics
   */
  getMetrics() {
    const modelMetrics = {};
    
    this.models.forEach((model, id) => {
      modelMetrics[id] = {
        ...model.metrics,
        averageInferenceTime: model.metrics.predictions > 0 ? 
          model.metrics.totalInferenceTime / model.metrics.predictions : 0
      };
    });
    
    return {
      ...this.metrics,
      models: modelMetrics,
      activeJobs: this.activeJobs.size,
      totalModels: this.models.size,
      totalPipelines: this.pipelines.size
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    // Dispose TensorFlow resources
    tf.engine().endScope();
    tf.disposeVariables();
    
    // Clear caches
    this.models.clear();
    this.pipelines.clear();
    this.activeJobs.clear();
    
    logger.info('AI Framework cleanup completed');
  }

  /**
   * Run the defect detection pipeline
   * @param {Object} input - Image input (buffer, path, or tensor)
   * @param {Object} options - Pipeline options
   * @returns {Promise<Object>} Pipeline execution result
   */
  async runDefectDetectionPipeline(input, options = {}) {
    return this.executePipeline('defect-detection-pipeline', input, options);
  }
}

// Create singleton instance
const aiFramework = new AIFramework();

// Export framework and utilities
module.exports = {
  aiFramework,
  AIFramework,
  tf,
  natural,
  brain
}; 