/**
 * customerRepository.js
 * 
 * Repository implementation for Customer domain
 */

const Repository = require('../../../core/Repository');
const Customer = require('../models/Customer');
const Address = require('../models/Address');
const Contact = require('../models/Contact');
const mongoose = require('mongoose');
const CustomerModel = mongoose.model('Customer');

class CustomerRepository extends Repository {
  /**
   * Find a customer by its ID
   * @param {string} id - ID of the customer to find
   * @returns {Promise<Customer|null>} - Customer if found, null otherwise
   */
  async findById(id) {
    try {
      const customerDoc = await CustomerModel.findById(id);
      if (!customerDoc) return null;
      
      return this._mapToDomainEntity(customerDoc);
    } catch (error) {
      console.error('Error in CustomerRepository.findById:', error);
      throw error;
    }
  }

  /**
   * Find all customers matching the query
   * @param {Object} query - Query to match customers against
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Customer>>} - Array of customers
   */
  async findAll(query = {}, options = {}) {
    try {
      const { skip = 0, limit = 50, sort = { createdAt: -1 } } = options;
      
      const customerDocs = await CustomerModel.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);
      
      return customerDocs.map(doc => this._mapToDomainEntity(doc));
    } catch (error) {
      console.error('Error in CustomerRepository.findAll:', error);
      throw error;
    }
  }

  /**
   * Save a customer
   * @param {Customer} customer - Customer to save
   * @returns {Promise<Customer>} - Saved customer
   */
  async save(customer) {
    try {
      if (!(customer instanceof Customer)) {
        throw new Error('Entity must be a Customer instance');
      }
      
      const customerData = this._mapToDatabaseEntity(customer);
      
      let customerDoc;
      
      if (customer.id) {
        // Update existing customer
        customerDoc = await CustomerModel.findByIdAndUpdate(
          customer.id,
          { $set: customerData },
          { new: true, runValidators: true }
        );
      } else {
        // Create new customer
        customerDoc = await CustomerModel.create(customerData);
      }
      
      return this._mapToDomainEntity(customerDoc);
    } catch (error) {
      console.error('Error in CustomerRepository.save:', error);
      throw error;
    }
  }

  /**
   * Delete a customer
   * @param {string|Customer} idOrEntity - ID of the customer to delete or the customer itself
   * @returns {Promise<boolean>} - True if the customer was deleted
   */
  async delete(idOrEntity) {
    try {
      const id = idOrEntity instanceof Customer ? idOrEntity.id : idOrEntity;
      
      const result = await CustomerModel.deleteOne({ _id: id });
      
      return result.deletedCount > 0;
    } catch (error) {
      console.error('Error in CustomerRepository.delete:', error);
      throw error;
    }
  }

  /**
   * Count customers matching the query
   * @param {Object} query - Query to match customers against
   * @returns {Promise<number>} - Number of customers matching the query
   */
  async count(query = {}) {
    try {
      return await CustomerModel.countDocuments(query);
    } catch (error) {
      console.error('Error in CustomerRepository.count:', error);
      throw error;
    }
  }

  /**
   * Check if a customer exists
   * @param {Object} query - Query to match customers against
   * @returns {Promise<boolean>} - True if a customer matching the query exists
   */
  async exists(query) {
    try {
      return await CustomerModel.exists(query) !== null;
    } catch (error) {
      console.error('Error in CustomerRepository.exists:', error);
      throw error;
    }
  }

  /**
   * Find customers by name (partial match)
   * @param {string} name - Name to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Customer>>} - Array of matching customers
   */
  async findByName(name, options = {}) {
    try {
      const query = { name: { $regex: name, $options: 'i' } };
      return this.findAll(query, options);
    } catch (error) {
      console.error('Error in CustomerRepository.findByName:', error);
      throw error;
    }
  }

  /**
   * Find customers by status
   * @param {string} status - Status to search for
   * @param {Object} options - Options for pagination, sorting, etc.
   * @returns {Promise<Array<Customer>>} - Array of matching customers
   */
  async findByStatus(status, options = {}) {
    try {
      const query = { status };
      return this.findAll(query, options);
    } catch (error) {
      console.error('Error in CustomerRepository.findByStatus:', error);
      throw error;
    }
  }

  /**
   * Map a database entity to a domain entity
   * @param {Object} dbEntity - Database entity
   * @returns {Customer} - Domain entity
   */
  _mapToDomainEntity(dbEntity) {
    if (!dbEntity) return null;
    
    const customerData = {
      id: dbEntity._id.toString(),
      name: dbEntity.name,
      code: dbEntity.code,
      type: dbEntity.type,
      status: dbEntity.status,
      creditRating: dbEntity.creditRating,
      paymentTerms: dbEntity.paymentTerms,
      website: dbEntity.website,
      industry: dbEntity.industry,
      description: dbEntity.description,
      tags: dbEntity.tags,
      address: dbEntity.address,
      contacts: dbEntity.contacts,
      createdAt: dbEntity.createdAt,
      updatedAt: dbEntity.updatedAt
    };
    
    return new Customer(customerData);
  }

  /**
   * Map a domain entity to a database entity
   * @param {Customer} domainEntity - Domain entity
   * @returns {Object} - Database entity
   */
  _mapToDatabaseEntity(domainEntity) {
    const customerData = domainEntity.toObject();
    
    // Convert id to _id if it exists
    if (customerData.id) {
      customerData._id = customerData.id;
      delete customerData.id;
    }
    
    return customerData;
  }
}

module.exports = new CustomerRepository(); 