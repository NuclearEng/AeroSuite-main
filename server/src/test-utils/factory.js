/**
 * factory.js
 *
 * Test data factory utilities for AeroSuite
 * Provides generators for Supplier, Customer, Inspection, and Component
 */

const faker = require('faker');

function supplierFactory(overrides = {}) {
  return {
    name: faker.company.companyName(),
    email: faker.internet.email(),
    phone: faker.phone.phoneNumber(),
    address: {
      street: faker.address.streetAddress(),
      city: faker.address.city(),
      country: faker.address.country()
    },
    ...overrides
  };
}

function customerFactory(overrides = {}) {
  return {
    name: faker.company.companyName(),
    email: faker.internet.email(),
    phone: faker.phone.phoneNumber(),
    address: {
      street: faker.address.streetAddress(),
      city: faker.address.city(),
      country: faker.address.country()
    },
    ...overrides
  };
}

function inspectionFactory(overrides = {}) {
  return {
    type: faker.random.arrayElement(['initial', 'routine', 'final']),
    scheduledDate: faker.date.future(),
    customerId: faker.datatype.uuid(),
    supplierId: faker.datatype.uuid(),
    status: faker.random.arrayElement(['scheduled', 'in-progress', 'completed']),
    ...overrides
  };
}

function componentFactory(overrides = {}) {
  return {
    name: faker.commerce.productName(),
    partNumber: faker.datatype.uuid(),
    category: faker.commerce.department(),
    supplierId: faker.datatype.uuid(),
    stockQuantity: faker.datatype.number({ min: 0, max: 1000 }),
    ...overrides
  };
}

module.exports = {
  supplierFactory,
  customerFactory,
  inspectionFactory,
  componentFactory
}; 