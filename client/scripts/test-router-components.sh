#!/bin/bash

# Script to run tests for React Router components
# This script runs tests for components that use React Router hooks

echo "Running tests for React Router components..."

# Run tests for customer components
echo "Testing customer components..."
npx jest src/pages/customers/CustomerDetail.test.tsx src/pages/customers/CustomerList.test.tsx src/pages/customers/EditCustomer.test.tsx

# Run tests for supplier components
echo "Testing supplier components..."
npx jest src/pages/suppliers/SupplierDetail.test.tsx src/pages/suppliers/SupplierList.test.tsx

# Run all tests with router in the name
echo "Testing all components with 'router' in the name..."
npx jest --testNamePattern="router"

echo "Tests completed." 