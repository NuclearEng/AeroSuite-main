
// ESLint Error Test File

// Unused variable
const unusedVar = 'test';

// Missing semicolon
const missingSemi = 'test'

// Unreachable code
function testFunction() {
  return true;
  console.log('unreachable'); // Should cause ESLint warning
}

// Undefined variable
console.log(undefinedVariable);

// console.log in production
console.log('This should trigger no-console rule');
