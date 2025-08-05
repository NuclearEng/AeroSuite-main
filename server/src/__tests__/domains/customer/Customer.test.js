/**
 * Customer.test.js
 * 
 * Tests for the Customer domain model
 */

const { Customer, Address, Contact } = require('../../../domains/customer/models');
const { DomainError } = require('../../../core/errors');

describe('Customer Domain Model', () => {
  describe('Customer Aggregate', () => {
    it('should create a valid customer', () => {
      const customer = new Customer({
        name: 'Acme Corporation',
        code: 'ACME001',
        type: 'enterprise',
        address: {
          street: '123 Main St',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
          country: 'USA'
        },
        contacts: [
          {
            name: 'John Doe',
            email: 'john@acme.com',
            phone: '555-1234',
            position: 'CEO',
            department: 'Executive'
          }
        ],
        creditRating: 'A',
        paymentTerms: 'Net 30',
        website: 'https://acme.com',
        industry: 'Manufacturing',
        description: 'Leading manufacturer of widgets',
        tags: ['manufacturing', 'enterprise']
      });
      
      expect(customer.id).toBeDefined();
      expect(customer.name).toBe('Acme Corporation');
      expect(customer.code).toBe('ACME001');
      expect(customer.type).toBe('enterprise');
      expect(customer.status).toBe('active');
      expect(customer.creditRating).toBe('A');
      expect(customer.paymentTerms).toBe('Net 30');
      expect(customer.website).toBe('https://acme.com');
      expect(customer.industry).toBe('Manufacturing');
      expect(customer.description).toBe('Leading manufacturer of widgets');
      expect(customer.tags).toEqual(['manufacturing', 'enterprise']);
      
      // Check address
      expect(customer.address).toBeInstanceOf(Address);
      expect(customer.address.street).toBe('123 Main St');
      expect(customer.address.city).toBe('Metropolis');
      
      // Check contacts
      expect(customer.contacts).toHaveLength(1);
      expect(customer.contacts[0]).toBeInstanceOf(Contact);
      expect(customer.contacts[0].name).toBe('John Doe');
      expect(customer.contacts[0].isPrimary).toBe(true); // First contact should be primary
    });
    
    it('should throw error for invalid customer', () => {
      expect(() => {
        new Customer({
          code: 'ACME001',
          type: 'enterprise'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Customer({
          name: 'Acme Corporation',
          type: 'enterprise'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Customer({
          name: 'Acme Corporation',
          code: 'ACME001',
          type: 'enterprise',
          status: 'invalid'
        });
      }).toThrow(DomainError);
    });
    
    it('should update customer details', () => {
      const customer = new Customer({
        name: 'Acme Corporation',
        code: 'ACME001',
        type: 'enterprise',
        address: {
          street: '123 Main St',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
          country: 'USA'
        }
      });
      
      customer.updateDetails({
        name: 'Acme Corp',
        industry: 'Technology',
        tags: ['tech', 'enterprise']
      });
      
      expect(customer.name).toBe('Acme Corp');
      expect(customer.industry).toBe('Technology');
      expect(customer.tags).toEqual(['tech', 'enterprise']);
      
      // Check domain events
      const events = customer.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('CustomerDetailsUpdated');
      expect(events[0].payload.customerId).toBe(customer.id);
    });
    
    it('should update customer status', () => {
      const customer = new Customer({
        name: 'Acme Corporation',
        code: 'ACME001',
        type: 'enterprise',
        address: {
          street: '123 Main St',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
          country: 'USA'
        }
      });
      
      customer.updateStatus('inactive');
      
      expect(customer.status).toBe('inactive');
      
      // Check domain events
      const events = customer.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('CustomerStatusUpdated');
      expect(events[0].payload.status).toBe('inactive');
      
      // Should throw for invalid status
      expect(() => {
        customer.updateStatus('invalid');
      }).toThrow(DomainError);
    });
    
    it('should manage contacts correctly', () => {
      const customer = new Customer({
        name: 'Acme Corporation',
        code: 'ACME001',
        type: 'enterprise',
        address: {
          street: '123 Main St',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
          country: 'USA'
        }
      });
      
      // Add first contact (should be primary)
      const contact1 = customer.addContact({
        name: 'John Doe',
        email: 'john@acme.com',
        phone: '555-1234',
        position: 'CEO'
      });
      
      expect(customer.contacts).toHaveLength(1);
      expect(contact1.isPrimary).toBe(true);
      
      // Add second contact (not primary)
      const contact2 = customer.addContact({
        name: 'Jane Smith',
        email: 'jane@acme.com',
        phone: '555-5678',
        position: 'CFO',
        isPrimary: false
      });
      
      expect(customer.contacts).toHaveLength(2);
      expect(contact1.isPrimary).toBe(true);
      expect(contact2.isPrimary).toBe(false);
      
      // Add third contact as primary
      const contact3 = customer.addContact({
        name: 'Bob Johnson',
        email: 'bob@acme.com',
        phone: '555-9012',
        position: 'CTO',
        isPrimary: true
      });
      
      expect(customer.contacts).toHaveLength(3);
      expect(contact1.isPrimary).toBe(false);
      expect(contact2.isPrimary).toBe(false);
      expect(contact3.isPrimary).toBe(true);
      
      // Update contact
      customer.updateContact(contact2.id, {
        position: 'COO',
        department: 'Operations'
      });
      
      const updatedContact2 = customer.contacts.find(c => c.id === contact2.id);
      expect(updatedContact2.position).toBe('COO');
      expect(updatedContact2.department).toBe('Operations');
      
      // Remove contact
      customer.removeContact(contact1.id);
      expect(customer.contacts).toHaveLength(2);
      expect(customer.contacts.find(c => c.id === contact1.id)).toBeUndefined();
      
      // Remove primary contact
      customer.removeContact(contact3.id);
      expect(customer.contacts).toHaveLength(1);
      expect(customer.contacts[0].isPrimary).toBe(true); // Remaining contact should be primary
    });
    
    it('should create customer with factory method', () => {
      const customer = Customer.create({
        name: 'Acme Corporation',
        code: 'ACME001',
        type: 'enterprise',
        address: {
          street: '123 Main St',
          city: 'Metropolis',
          state: 'NY',
          postalCode: '10001',
          country: 'USA'
        }
      });
      
      expect(customer).toBeInstanceOf(Customer);
      
      // Check domain events
      const events = customer.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('CustomerCreated');
      expect(events[0].payload.customerId).toBe(customer.id);
    });
  });
  
  describe('Address Value Object', () => {
    it('should create a valid address', () => {
      const address = new Address({
        street: '123 Main St',
        city: 'Metropolis',
        state: 'NY',
        postalCode: '10001',
        country: 'USA'
      });
      
      expect(address.street).toBe('123 Main St');
      expect(address.city).toBe('Metropolis');
      expect(address.state).toBe('NY');
      expect(address.postalCode).toBe('10001');
      expect(address.country).toBe('USA');
    });
    
    it('should throw error for invalid address', () => {
      expect(() => {
        new Address({
          city: 'Metropolis',
          state: 'NY',
          country: 'USA'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Address({
          street: '123 Main St',
          state: 'NY',
          country: 'USA'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Address({
          street: '123 Main St',
          city: 'Metropolis',
          state: 'NY'
        });
      }).toThrow(DomainError);
    });
    
    it('should format full address correctly', () => {
      const address = new Address({
        street: '123 Main St',
        city: 'Metropolis',
        state: 'NY',
        postalCode: '10001',
        country: 'USA'
      });
      
      expect(address.getFullAddress()).toBe('123 Main St, Metropolis, NY 10001, USA');
      
      const addressNoState = new Address({
        street: '123 Main St',
        city: 'London',
        postalCode: 'SW1A 1AA',
        country: 'UK'
      });
      
      expect(addressNoState.getFullAddress()).toBe('123 Main St, London, SW1A 1AA, UK');
    });
  });
  
  describe('Contact Entity', () => {
    it('should create a valid contact', () => {
      const contact = new Contact({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234',
        position: 'CEO',
        department: 'Executive'
      });
      
      expect(contact.id).toBeDefined();
      expect(contact.name).toBe('John Doe');
      expect(contact.email).toBe('john@example.com');
      expect(contact.phone).toBe('555-1234');
      expect(contact.position).toBe('CEO');
      expect(contact.department).toBe('Executive');
      expect(contact.isPrimary).toBe(false);
    });
    
    it('should throw error for invalid contact', () => {
      expect(() => {
        new Contact({
          email: 'john@example.com',
          phone: '555-1234'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Contact({
          name: 'John Doe',
          phone: '555-1234'
        });
      }).toThrow(DomainError);
      
      expect(() => {
        new Contact({
          name: 'John Doe',
          email: 'invalid-email'
        });
      }).toThrow(DomainError);
    });
    
    it('should update contact details', () => {
      const contact = new Contact({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234'
      });
      
      contact.updateDetails({
        name: 'John Smith',
        email: 'john.smith@example.com',
        position: 'CTO',
        department: 'Technology'
      });
      
      expect(contact.name).toBe('John Smith');
      expect(contact.email).toBe('john.smith@example.com');
      expect(contact.position).toBe('CTO');
      expect(contact.department).toBe('Technology');
    });
    
    it('should handle primary contact status', () => {
      const contact = new Contact({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '555-1234'
      });
      
      expect(contact.isPrimary).toBe(false);
      
      contact.makePrimary();
      expect(contact.isPrimary).toBe(true);
      
      contact.removePrimary();
      expect(contact.isPrimary).toBe(false);
    });
  });
}); 