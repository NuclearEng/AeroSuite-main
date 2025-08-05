/**
 * ERP System Integration Configuration
 * 
 * This file contains configuration settings for connecting to various ERP systems.
 * The configuration supports multiple ERP providers and environments.
 */

const config = {
  // Active ERP provider
  activeProvider: process.env.ERP_PROVIDER || 'sap',
  
  // Global ERP settings
  global: {
    timeout: parseInt(process.env.ERP_TIMEOUT || '30000', 10),
    retryAttempts: parseInt(process.env.ERP_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.ERP_RETRY_DELAY || '2000', 10),
    cacheEnabled: process.env.ERP_CACHE_ENABLED === 'true',
    cacheTTL: parseInt(process.env.ERP_CACHE_TTL || '300000', 10), // 5 minutes
    logLevel: process.env.ERP_LOG_LEVEL || 'info',
  },
  
  // SAP ERP configuration
  sap: {
    baseUrl: process.env.SAP_API_URL || 'https://api.sap-erp.example.com',
    version: process.env.SAP_API_VERSION || 'v1',
    clientId: process.env.SAP_CLIENT_ID,
    clientSecret: process.env.SAP_CLIENT_SECRET,
    username: process.env.SAP_USERNAME,
    password: process.env.SAP_PASSWORD,
    companyDb: process.env.SAP_COMPANY_DB,
    language: process.env.SAP_LANGUAGE || 'en-US',
    modules: {
      inventory: {
        enabled: true,
        endpoint: '/Inventory',
      },
      purchasing: {
        enabled: true,
        endpoint: '/PurchaseOrders',
      },
      vendors: {
        enabled: true,
        endpoint: '/BusinessPartners',
      },
      production: {
        enabled: true,
        endpoint: '/ProductionOrders',
      },
      qualityManagement: {
        enabled: true,
        endpoint: '/QualityControl',
      },
    },
  },
  
  // Oracle ERP configuration
  oracle: {
    baseUrl: process.env.ORACLE_API_URL || 'https://api.oracle-erp.example.com',
    version: process.env.ORACLE_API_VERSION || 'v1',
    clientId: process.env.ORACLE_CLIENT_ID,
    clientSecret: process.env.ORACLE_CLIENT_SECRET,
    username: process.env.ORACLE_USERNAME,
    password: process.env.ORACLE_PASSWORD,
    instanceId: process.env.ORACLE_INSTANCE_ID,
    modules: {
      inventory: {
        enabled: true,
        endpoint: '/inventory/items',
      },
      purchasing: {
        enabled: true,
        endpoint: '/procurement/purchaseOrders',
      },
      vendors: {
        enabled: true,
        endpoint: '/suppliers',
      },
      production: {
        enabled: true,
        endpoint: '/manufacturing/workOrders',
      },
      qualityManagement: {
        enabled: true,
        endpoint: '/quality/inspections',
      },
    },
  },
  
  // Microsoft Dynamics 365 configuration
  dynamics365: {
    baseUrl: process.env.DYNAMICS_API_URL || 'https://api.dynamics.example.com',
    version: process.env.DYNAMICS_API_VERSION || 'v9.0',
    tenantId: process.env.DYNAMICS_TENANT_ID,
    clientId: process.env.DYNAMICS_CLIENT_ID,
    clientSecret: process.env.DYNAMICS_CLIENT_SECRET,
    scope: process.env.DYNAMICS_SCOPE || 'https://api.dynamics.com/.default',
    modules: {
      inventory: {
        enabled: true,
        endpoint: '/products',
      },
      purchasing: {
        enabled: true,
        endpoint: '/purchaseorders',
      },
      vendors: {
        enabled: true,
        endpoint: '/vendors',
      },
      production: {
        enabled: true,
        endpoint: '/workorders',
      },
      qualityManagement: {
        enabled: true,
        endpoint: '/qualitycontrols',
      },
    },
  },
  
  // NetSuite ERP configuration
  netsuite: {
    baseUrl: process.env.NETSUITE_API_URL || 'https://api.netsuite.example.com',
    version: process.env.NETSUITE_API_VERSION || 'v1',
    accountId: process.env.NETSUITE_ACCOUNT_ID,
    consumerKey: process.env.NETSUITE_CONSUMER_KEY,
    consumerSecret: process.env.NETSUITE_CONSUMER_SECRET,
    tokenId: process.env.NETSUITE_TOKEN_ID,
    tokenSecret: process.env.NETSUITE_TOKEN_SECRET,
    modules: {
      inventory: {
        enabled: true,
        endpoint: '/record/inventoryitem',
      },
      purchasing: {
        enabled: true,
        endpoint: '/record/purchaseorder',
      },
      vendors: {
        enabled: true,
        endpoint: '/record/vendor',
      },
      production: {
        enabled: true,
        endpoint: '/record/manufacturingoperation',
      },
      qualityManagement: {
        enabled: true,
        endpoint: '/record/customrecord_qualityinspection',
      },
    },
  },
  
  // Mock ERP for development/testing
  mock: {
    baseUrl: process.env.MOCK_ERP_URL || 'http://localhost:3099/mock-erp',
    enabled: process.env.MOCK_ERP_ENABLED === 'true' || process.env.NODE_ENV === 'development',
    delayMs: parseInt(process.env.MOCK_ERP_DELAY_MS || '100', 10),
    modules: {
      inventory: {
        enabled: true,
        endpoint: '/inventory',
      },
      purchasing: {
        enabled: true,
        endpoint: '/purchaseOrders',
      },
      vendors: {
        enabled: true,
        endpoint: '/vendors',
      },
      production: {
        enabled: true,
        endpoint: '/production',
      },
      qualityManagement: {
        enabled: true,
        endpoint: '/quality',
      },
    },
  }
};

// Helper function to get config for active provider
const getActiveConfig = () => {
  const provider = config.activeProvider;
  if (!config[provider]) {
    throw new Error(`ERP provider '${provider}' is not configured`);
  }
  return {
    provider,
    ...config.global,
    ...config[provider]
  };
};

module.exports = {
  config,
  getActiveConfig
}; 