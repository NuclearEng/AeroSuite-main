/**
 * Encryption Verification Script
 * Related to: TS132 - Data Encryption Core, SEC003 - Data Encryption at Rest
 * 
 * This script verifies the encryption implementation by:
 * 1. Testing the encryption and decryption of various data types
 * 2. Verifying key rotation functionality
 * 3. Testing file encryption and decryption
 * 4. Testing the security of stored keys
 * 5. Validating the encryption algorithm strength
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const encryptionCore = require('../server/src/core/encryption');

// Create a temporary directory for testing
const TEST_DIR = path.join(__dirname, 'encryption-test');
if (!fs.existsSync(TEST_DIR)) {
  fs.mkdirSync(TEST_DIR, { recursive: true });
}

// Cleanup function to remove test files
function cleanup() {
  if (fs.existsSync(TEST_DIR)) {
    fs.readdirSync(TEST_DIR).forEach(file => {
      fs.unlinkSync(path.join(TEST_DIR, file));
    });
    fs.rmdirSync(TEST_DIR);
  }
}

// Helper functions
function logSuccess(message) {
  console.log(`✓ SUCCESS: ${message}`);
}

function logFailure(message) {
  console.error(`✗ FAILURE: ${message}`);
}

function logInfo(message) {
  console.log(`ℹ INFO: ${message}`);
}

// Test data
const testData = {
  string: 'This is a test string with special characters: !@#$%^&*()_+{}[]|:;<>,.?/',
  json: JSON.stringify({ name: 'Test Object', value: 123, nested: { key: 'value' } }),
  binary: crypto.randomBytes(1024),
  longText: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(100)
};

// Test the encryption core
async function runTests() {
  try {
    console.log('=== ENCRYPTION CORE VERIFICATION TESTS ===');
    let testsPassed = 0;
    let testsFailed = 0;
    
    // Initialize encryption core with test configuration
    logInfo('Initializing encryption core...');
    const testConfig = {
      keyDirectory: path.join(TEST_DIR, 'keys'),
      masterKeyPath: path.join(TEST_DIR, 'master.key'),
      activeKeyId: 'test-key-1'
    };
    
    await encryptionCore.initialize(testConfig);
    logSuccess('Encryption core initialized');
    testsPassed++;
    
    // Test 1: Encryption and decryption of string data
    logInfo('Testing string encryption and decryption...');
    const encryptedString = await encryptionCore.encryptData(testData.string);
    const decryptedString = await encryptionCore.decryptData(encryptedString);
    
    if (decryptedString.toString() === testData.string) {
      logSuccess('String encryption and decryption successful');
      testsPassed++;
    } else {
      logFailure('String encryption and decryption failed');
      testsFailed++;
    }
    
    // Test 2: Encryption and decryption of JSON data
    logInfo('Testing JSON encryption and decryption...');
    const encryptedJson = await encryptionCore.encryptData(testData.json);
    const decryptedJson = await encryptionCore.decryptData(encryptedJson);
    
    if (decryptedJson.toString() === testData.json) {
      logSuccess('JSON encryption and decryption successful');
      testsPassed++;
    } else {
      logFailure('JSON encryption and decryption failed');
      testsFailed++;
    }
    
    // Test 3: Encryption and decryption of binary data
    logInfo('Testing binary encryption and decryption...');
    const encryptedBinary = await encryptionCore.encryptData(testData.binary);
    const decryptedBinary = await encryptionCore.decryptData(encryptedBinary);
    
    if (Buffer.compare(decryptedBinary, testData.binary) === 0) {
      logSuccess('Binary encryption and decryption successful');
      testsPassed++;
    } else {
      logFailure('Binary encryption and decryption failed');
      testsFailed++;
    }
    
    // Test 4: Encryption and decryption of long text
    logInfo('Testing long text encryption and decryption...');
    const encryptedLongText = await encryptionCore.encryptData(testData.longText);
    const decryptedLongText = await encryptionCore.decryptData(encryptedLongText);
    
    if (decryptedLongText.toString() === testData.longText) {
      logSuccess('Long text encryption and decryption successful');
      testsPassed++;
    } else {
      logFailure('Long text encryption and decryption failed');
      testsFailed++;
    }
    
    // Test 5: Key rotation
    logInfo('Testing key rotation...');
    const newKeyId = await encryptionCore.rotateEncryptionKey('test-key-2');
    
    // Encrypt with new key
    const encryptedWithNewKey = await encryptionCore.encryptData(testData.string, newKeyId);
    const decryptedWithNewKey = await encryptionCore.decryptData(encryptedWithNewKey);
    
    if (decryptedWithNewKey.toString() === testData.string) {
      logSuccess('Key rotation successful');
      testsPassed++;
    } else {
      logFailure('Key rotation failed');
      testsFailed++;
    }
    
    // Test 6: File encryption and decryption
    logInfo('Testing file encryption and decryption...');
    const testFile = path.join(TEST_DIR, 'test-file.txt');
    const encryptedFile = path.join(TEST_DIR, 'test-file.encrypted');
    const decryptedFile = path.join(TEST_DIR, 'test-file.decrypted');
    
    // Create test file
    fs.writeFileSync(testFile, testData.longText);
    
    // Encrypt and decrypt file
    await encryptionCore.encryptFile(testFile, encryptedFile);
    await encryptionCore.decryptFile(encryptedFile, decryptedFile);
    
    const originalContent = fs.readFileSync(testFile, 'utf8');
    const decryptedContent = fs.readFileSync(decryptedFile, 'utf8');
    
    if (originalContent === decryptedContent) {
      logSuccess('File encryption and decryption successful');
      testsPassed++;
    } else {
      logFailure('File encryption and decryption failed');
      testsFailed++;
    }
    
    // Test 7: Key security - check if keys are securely stored
    logInfo('Testing key security...');
    const masterKeyPath = path.join(TEST_DIR, 'master.key');
    const keyDirectoryPath = path.join(TEST_DIR, 'keys');
    
    // Check if master key exists
    if (fs.existsSync(masterKeyPath)) {
      const masterKeyStats = fs.statSync(masterKeyPath);
      const fileMode = masterKeyStats.mode.toString(8);
      
      // Check if file mode is secure (ends with 600 in octal)
      if (fileMode.endsWith('600') || fileMode.endsWith('700') || fileMode.endsWith('400')) {
        logSuccess('Master key has secure file permissions');
        testsPassed++;
      } else {
        logFailure(`Master key has insecure file permissions: ${fileMode}`);
        testsFailed++;
      }
    } else {
      logFailure('Master key file not found');
      testsFailed++;
    }
    
    // Test 8: Verify encryption algorithm strength
    logInfo('Verifying encryption algorithm strength...');
    const status = await encryptionCore.getStatus();
    
    if (status.algorithm.includes('256') || status.algorithm.includes('gcm')) {
      logSuccess(`Encryption using strong algorithm: ${status.algorithm}`);
      testsPassed++;
    } else {
      logFailure(`Encryption using potentially weak algorithm: ${status.algorithm}`);
      testsFailed++;
    }
    
    // Test 9: Hash function test
    logInfo('Testing hash function...');
    const hash1 = encryptionCore.hashData('test data');
    const hash2 = encryptionCore.hashData('test data');
    const hash3 = encryptionCore.hashData('different data');
    
    if (hash1 === hash2 && hash1 !== hash3) {
      logSuccess('Hash function working correctly');
      testsPassed++;
    } else {
      logFailure('Hash function not working correctly');
      testsFailed++;
    }
    
    // Test 10: Key pair generation
    logInfo('Testing key pair generation...');
    const keyPair = await encryptionCore.generateKeyPair('rsa', { modulusLength: 2048 });
    
    if (keyPair.publicKey && keyPair.publicKey.includes('PUBLIC KEY') &&
        keyPair.privateKey && keyPair.privateKey.includes('PRIVATE KEY')) {
      logSuccess('Key pair generation successful');
      testsPassed++;
    } else {
      logFailure('Key pair generation failed');
      testsFailed++;
    }
    
    // Summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total tests: ${testsPassed + testsFailed}`);
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    
    // Cleanup
    cleanup();
    
    if (testsFailed === 0) {
      console.log('\n✓ ALL TESTS PASSED - Encryption Core is working correctly');
      process.exit(0);
    } else {
      console.error(`\n✗ ${testsFailed} TEST(S) FAILED - Encryption Core has issues`);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during encryption verification:', error);
    cleanup();
    process.exit(1);
  }
}

// Run the tests
runTests(); 