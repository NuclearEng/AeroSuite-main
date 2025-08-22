
// TypeScript Error Test File
import { NonExistentType } from './non-existent-module';

interface TestInterface {
  name: string;
  age: number;
}

class TestClass implements TestInterface {
  name: string;
  // Missing age property - should cause TS2420 error
  
  constructor(name: string) {
    this.name = name;
    this.undefinedProperty = 'test'; // Should cause TS2339 error
  }
  
  method(): NonExistentType { // Should cause TS2304 error
    return null as any;
  }
}

// Type mismatch error
const test: TestInterface = {
  name: 'test',
  age: 'not a number' // Should cause TS2322 error
};

// Unused variable
const unusedVariable = 'test'; // Should cause ESLint error if configured

// Modified for watch test