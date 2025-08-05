/**
 * Anti-Corruption Layer Tests
 * 
 * Tests for the Anti-Corruption Layer pattern implementation.
 */

const { acl } = require('../../infrastructure');
const SapAntiCorruptionLayer = require('../../infrastructure/anti-corruption-layer/SapAntiCorruptionLayer');
const OracleAntiCorruptionLayer = require('../../infrastructure/anti-corruption-layer/OracleAntiCorruptionLayer');
const AntiCorruptionLayerFactory = require('../../infrastructure/anti-corruption-layer/AntiCorruptionLayerFactory');

// Mock the ERP config
jest.mock('../../config/erp-config', () => ({
  getActiveConfig: jest.fn().mockReturnValue({ provider: 'sap' })
}));

describe('Anti-Corruption Layer', () => {
  describe('Factory', () => {
    it('should create SAP ACL when provider is SAP', () => {
      const aclInstance = AntiCorruptionLayerFactory.create('sap');
      expect(aclInstance).toBeInstanceOf(SapAntiCorruptionLayer);
    });
    
    it('should create Oracle ACL when provider is Oracle', () => {
      const aclInstance = AntiCorruptionLayerFactory.create('oracle');
      expect(aclInstance).toBeInstanceOf(OracleAntiCorruptionLayer);
    });
    
    it('should throw error for unsupported provider', () => {
      expect(() => {
        AntiCorruptionLayerFactory.create('unknown');
      }).toThrow('Unsupported ERP provider');
    });
    
    it('should create ACL from config', () => {
      const aclInstance = AntiCorruptionLayerFactory.createFromConfig();
      expect(aclInstance).toBeInstanceOf(SapAntiCorruptionLayer);
    });
  });
  
  describe('SAP ACL', () => {
    let sapAcl;
    
    beforeEach(() => {
      sapAcl = new SapAntiCorruptionLayer();
    });
    
    it('should translate SAP vendor to supplier', () => {
      const sapVendor = {
        CardCode: 'V001',
        CardName: 'Test Supplier',
        EmailAddress: 'test@supplier.com',
        Phone1: '123-456-7890',
        Cellular: '987-654-3210',
        Website: 'https://supplier.com',
        Address: '123 Main St',
        City: 'Test City',
        ZipCode: '12345',
        Country: 'Test Country',
        Frozen: 'N'
      };
      
      const supplier = sapAcl.translateToDomain('supplier', sapVendor);
      
      expect(supplier).toMatchObject({
        code: 'V001',
        name: 'Test Supplier',
        email: 'test@supplier.com',
        phone: '123-456-7890',
        mobilePhone: '987-654-3210',
        website: 'https://supplier.com',
        address: {
          street: '123 Main St',
          city: 'Test City',
          zipCode: '12345',
          country: 'Test Country'
        },
        metadata: {
          sourceSystem: 'SAP',
          sourceId: 'V001'
        }
      });
    });
    
    it('should translate supplier to SAP vendor', () => {
      const supplier = {
        code: 'V001',
        name: 'Test Supplier',
        email: 'test@supplier.com',
        phone: '123-456-7890',
        mobilePhone: '987-654-3210',
        website: 'https://supplier.com',
        address: {
          street: '123 Main St',
          city: 'Test City',
          zipCode: '12345',
          country: 'Test Country'
        }
      };
      
      const sapVendor = sapAcl.translateFromDomain('supplier', supplier);
      
      expect(sapVendor).toMatchObject({
        CardCode: 'V001',
        CardName: 'Test Supplier',
        CardType: 'S',
        EmailAddress: 'test@supplier.com',
        Phone1: '123-456-7890',
        Cellular: '987-654-3210',
        Website: 'https://supplier.com',
        Address: '123 Main St',
        City: 'Test City',
        ZipCode: '12345',
        Country: 'Test Country'
      });
    });
    
    it('should handle batch translation', () => {
      const sapVendors = [
        {
          CardCode: 'V001',
          CardName: 'Supplier 1',
          EmailAddress: 'supplier1@test.com'
        },
        {
          CardCode: 'V002',
          CardName: 'Supplier 2',
          EmailAddress: 'supplier2@test.com'
        }
      ];
      
      const suppliers = sapAcl.batchTranslateToDomain('supplier', sapVendors);
      
      expect(suppliers).toHaveLength(2);
      expect(suppliers[0].name).toBe('Supplier 1');
      expect(suppliers[1].name).toBe('Supplier 2');
    });
    
    it('should handle validation errors gracefully', () => {
      const invalidVendor = {
        // Missing CardName
        CardCode: 'V001'
      };
      
      const result = sapAcl.translateToDomain('supplier', invalidVendor);
      
      expect(result).toBeNull();
    });
  });
  
  describe('Oracle ACL', () => {
    let oracleAcl;
    
    beforeEach(() => {
      oracleAcl = new OracleAntiCorruptionLayer();
    });
    
    it('should get correct source ID based on entity type', () => {
      expect(oracleAcl.getOracleSourceId('supplier', { VENDOR_ID: 123 })).toBe('123');
      expect(oracleAcl.getOracleSourceId('inspection', { INSPECTION_ID: 456 })).toBe('456');
      expect(oracleAcl.getOracleSourceId('unknown', {})).toBe('unknown');
    });
    
    it('should enrich domain entities with additional data', () => {
      const supplier = { name: 'Test Supplier' };
      const oracleData = {
        TERMS_NAME: 'Net 30',
        TAX_CODE: 'TX001',
        CREDIT_LIMIT: 10000
      };
      
      const enriched = oracleAcl.enrichDomainEntity('supplier', supplier, oracleData);
      
      expect(enriched).toMatchObject({
        name: 'Test Supplier',
        paymentTerms: 'Net 30',
        taxCode: 'TX001',
        creditLimit: 10000
      });
    });
  });
}); 