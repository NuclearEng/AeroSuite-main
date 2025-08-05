/**
 * Tests for Threat Detection System
 * Task: SEC006 - Threat Detection System
 * 
 * This test suite verifies the functionality of the threat detection system,
 * especially focusing on the newly implemented functions for threat intelligence
 * and rule-based detection.
 */

const threatDetection = require('../../services/threatDetection');

// Mock the securityEventManagement module
jest.mock('../../services/securityEventManagement', () => ({
  onSIEMEvent: jest.fn(),
}));

// Mock the securityEventLogger module
jest.mock('../../utils/securityEventLogger', () => ({
  logSecurityEvent: jest.fn(),
  SEC_EVENT_SEVERITY: {
    INFO: 'INFO',
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL'
  }
}));

describe('Threat Detection System', () => {
  // Access private functions for testing
  const privateFunctions = {
    applyThreatIntelligence: threatDetection.__test__.applyThreatIntelligence,
    applyRuleBasedDetection: threatDetection.__test__.applyRuleBasedDetection,
    checkMaliciousIP: threatDetection.__test__.checkMaliciousIP,
    checkMaliciousDomain: threatDetection.__test__.checkMaliciousDomain,
    checkMaliciousHash: threatDetection.__test__.checkMaliciousHash,
    checkMaliciousURL: threatDetection.__test__.checkMaliciousURL,
    evaluateConditions: threatDetection.__test__.evaluateConditions,
    compareValues: threatDetection.__test__.compareValues
  };

  describe('Threat Intelligence Detection', () => {
    test('should detect malicious IP correctly', () => {
      // Test with a known malicious IP
      expect(privateFunctions.checkMaliciousIP('1.2.3.4', ['local'])).toBe(true);
      
      // Test with a safe IP
      expect(privateFunctions.checkMaliciousIP('8.8.8.8', ['local'])).toBe(false);
      
      // Test with multiple sources
      expect(privateFunctions.checkMaliciousIP('9.10.11.12', ['local', 'cloud'])).toBe(true);
    });

    test('should detect malicious domain correctly', () => {
      // Test with a known malicious domain
      expect(privateFunctions.checkMaliciousDomain('malicious-domain.com', ['local'])).toBe(true);
      
      // Test with a safe domain
      expect(privateFunctions.checkMaliciousDomain('google.com', ['local'])).toBe(false);
      
      // Test with multiple sources
      expect(privateFunctions.checkMaliciousDomain('evil-domain.com', ['local', 'cloud'])).toBe(true);
    });

    test('should detect malicious hash correctly', () => {
      // Test with a known malicious hash
      expect(privateFunctions.checkMaliciousHash('9e107d9d372bb6826bd81d3542a419d6', ['local'])).toBe(true);
      
      // Test with a safe hash
      expect(privateFunctions.checkMaliciousHash('safe-hash-value', ['local'])).toBe(false);
      
      // Test with multiple sources
      expect(privateFunctions.checkMaliciousHash('d41d8cd98f00b204e9800998ecf8427e', ['local', 'cloud'])).toBe(true);
    });

    test('should detect malicious URL correctly', () => {
      // Test with a known malicious URL
      expect(privateFunctions.checkMaliciousURL('http://malicious-domain.com/malware.exe', ['local'])).toBe(true);
      
      // Test with a safe URL
      expect(privateFunctions.checkMaliciousURL('https://google.com/search', ['local'])).toBe(false);
      
      // Test with multiple sources
      expect(privateFunctions.checkMaliciousURL('https://evil-domain.com/exploit', ['local', 'cloud'])).toBe(true);
    });

    test('should apply threat intelligence detection correctly', () => {
      // Create a mock event with malicious IP
      const event = {
        userId: 'user123',
        type: 'network:connection',
        metadata: {
          sourceIp: '1.2.3.4'
        }
      };
      
      // Create a rule that checks for malicious IPs
      const rule = {
        id: 'TD101',
        name: 'Malicious IP Connection',
        threatIntelligence: {
          indicatorField: 'metadata.sourceIp',
          indicatorType: 'IP',
          sources: ['local']
        }
      };
      
      // Test with a malicious IP
      expect(privateFunctions.applyThreatIntelligence(event, rule)).toBe(true);
      
      // Modify the event to have a safe IP
      event.metadata.sourceIp = '8.8.8.8';
      expect(privateFunctions.applyThreatIntelligence(event, rule)).toBe(false);
    });
  });

  describe('Rule-Based Detection', () => {
    test('should evaluate simple conditions correctly', () => {
      // Create a mock event
      const event = {
        userId: 'user123',
        type: 'auth:login',
        status: 'success',
        metadata: {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          loginAttempts: 1
        }
      };
      
      // Simple equals condition (true)
      expect(privateFunctions.evaluateConditions(event, {
        'userId': 'user123'
      })).toBe(true);
      
      // Simple equals condition (false)
      expect(privateFunctions.evaluateConditions(event, {
        'userId': 'user456'
      })).toBe(false);
      
      // Nested property condition (true)
      expect(privateFunctions.evaluateConditions(event, {
        'metadata.ipAddress': '192.168.1.1'
      })).toBe(true);
      
      // Nested property condition (false)
      expect(privateFunctions.evaluateConditions(event, {
        'metadata.ipAddress': '10.0.0.1'
      })).toBe(false);
      
      // Multiple conditions with AND logic (true)
      expect(privateFunctions.evaluateConditions(event, {
        'type': 'auth:login',
        'status': 'success'
      })).toBe(true);
      
      // Multiple conditions with AND logic (false)
      expect(privateFunctions.evaluateConditions(event, {
        'type': 'auth:login',
        'status': 'failed'
      })).toBe(false);
    });

    test('should evaluate complex conditions correctly', () => {
      // Create a mock event
      const event = {
        userId: 'user123',
        type: 'data:access',
        status: 'success',
        metadata: {
          dataSize: 5000,
          sensitive: true,
          accessTime: '2023-06-15T14:30:00Z'
        }
      };
      
      // Complex comparison (greater than) - true
      expect(privateFunctions.evaluateConditions(event, {
        'metadata.dataSize': { op: 'gt', value: 1000 }
      })).toBe(true);
      
      // Complex comparison (greater than) - false
      expect(privateFunctions.evaluateConditions(event, {
        'metadata.dataSize': { op: 'gt', value: 10000 }
      })).toBe(false);
      
      // Complex comparison (in array) - true
      expect(privateFunctions.evaluateConditions(event, {
        'type': { op: 'in', value: ['auth:login', 'data:access', 'user:create'] }
      })).toBe(true);
      
      // Complex comparison (in array) - false
      expect(privateFunctions.evaluateConditions(event, {
        'type': { op: 'in', value: ['auth:login', 'user:create'] }
      })).toBe(false);
      
      // Complex comparison (string contains) - true
      expect(privateFunctions.evaluateConditions(event, {
        'type': { op: 'contains', value: 'access' }
      })).toBe(true);
    });

    test('should apply rule-based detection correctly', () => {
      // Create a mock event
      const event = {
        userId: 'user123',
        type: 'data:access',
        status: 'success',
        metadata: {
          dataSize: 15000,
          sensitive: true,
          accessTime: '2023-06-15T14:30:00Z'
        }
      };
      
      // Create a rule that checks for large data access on sensitive data
      const rule = {
        id: 'TD201',
        name: 'Large Sensitive Data Access',
        conditions: {
          'type': 'data:access',
          'status': 'success',
          'metadata.sensitive': true,
          'metadata.dataSize': { op: 'gt', value: 10000 }
        }
      };
      
      // Test with matching conditions
      expect(privateFunctions.applyRuleBasedDetection(event, rule)).toBe(true);
      
      // Modify the event to have smaller data size
      event.metadata.dataSize = 5000;
      expect(privateFunctions.applyRuleBasedDetection(event, rule)).toBe(false);
    });
  });
}); 