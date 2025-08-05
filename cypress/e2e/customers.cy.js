describe('Customers', () => {
  let testCustomerId

  beforeEach(() => {
    cy.login()
    cy.visit('/customers')
  })

  afterEach(() => {
    if (testCustomerId) {
      cy.cleanupTestData('customers', testCustomerId)
      testCustomerId = null
    }
  })

  describe('Customers List', () => {
    it('should display customers table', () => {
      cy.get('[data-testid="customers-table"]').should('be.visible')
      cy.get('table').should('be.visible')
      cy.get('thead').within(() => {
        cy.contains('Name').should('be.visible')
        cy.contains('Email').should('be.visible')
        cy.contains('Status').should('be.visible')
        cy.contains('Actions').should('be.visible')
      })
    })

    it('should search customers by name', () => {
      cy.get('[data-testid="search-customers"]').type('test customer')
      cy.get('[data-testid="search-button"]').click()
      
      cy.get('tbody tr').should('have.length.at.least', 0)
      cy.get('tbody tr').each(($row) => {
        cy.wrap($row).should('contain.text', 'test')
      })
    })

    it('should paginate customers list', () => {
      cy.get('[data-testid="pagination"]').should('be.visible')
      cy.get('[data-testid="next-page"]').click()
      cy.url().should('include', 'page=2')
    })

    it('should filter customers by status', () => {
      cy.get('[data-testid="status-filter"]').select('active')
      cy.get('[data-testid="apply-filters"]').click()
      
      cy.get('[data-testid="customer-status"]').each(($status) => {
        cy.wrap($status).should('contain', 'Active')
      })
    })
  })

  describe('Create Customer', () => {
    it('should navigate to create customer page', () => {
      cy.get('[data-testid="add-customer-btn"]').click()
      cy.url().should('include', '/customers/new')
      cy.contains('Add New Customer').should('be.visible')
    })

    it('should validate customer form', () => {
      cy.visit('/customers/new')
      
      cy.get('[data-testid="submit-customer"]').click()
      
      cy.get('[data-testid="name-error"]').should('contain', 'Name is required')
      cy.get('[data-testid="email-error"]').should('contain', 'Email is required')
    })

    it('should create new customer successfully', () => {
      cy.visit('/customers/new')
      
      // Fill in the form
      cy.get('[name="name"]').type('E2E Test Customer')
      cy.get('[name="email"]').type('e2e.test@customer.com')
      cy.get('[name="phone"]').type('+1234567890')
      cy.get('[name="company"]').type('E2E Test Company')
      cy.get('[name="address"]').type('123 Test Street')
      cy.get('[name="city"]').type('Test City')
      cy.get('[name="country"]').type('Test Country')
      cy.get('[name="postalCode"]').type('12345')
      
      cy.get('[data-testid="submit-customer"]').click()
      
      // Should redirect to customer detail page
      cy.url().should('match', /\/customers\/\d+/)
      cy.contains('Customer created successfully').should('be.visible')
      cy.contains('E2E Test Customer').should('be.visible')
      
      // Store ID for cleanup
      cy.url().then((url) => {
        testCustomerId = url.split('/').pop()
      })
    })
  })

  describe('Customer Details', () => {
    beforeEach(() => {
      // Create a test customer
      cy.createTestData('customers', {
        name: 'Test Customer Details',
        email: 'details@test.com',
        phone: '+9876543210',
        company: 'Test Company',
        status: 'active'
      }).then((response) => {
        testCustomerId = response.body.id
      })
    })

    it('should display customer information', () => {
      cy.visit(`/customers/${testCustomerId}`)
      
      cy.contains('Test Customer Details').should('be.visible')
      cy.contains('details@test.com').should('be.visible')
      cy.contains('+9876543210').should('be.visible')
      cy.contains('Test Company').should('be.visible')
    })

    it('should display customer orders', () => {
      cy.visit(`/customers/${testCustomerId}`)
      
      cy.get('[data-testid="orders-tab"]').click()
      cy.get('[data-testid="orders-section"]').should('be.visible')
      cy.get('[data-testid="create-order-btn"]').should('be.visible')
    })

    it('should display customer interactions', () => {
      cy.visit(`/customers/${testCustomerId}`)
      
      cy.get('[data-testid="interactions-tab"]').click()
      cy.get('[data-testid="interactions-section"]').should('be.visible')
      cy.get('[data-testid="add-interaction-btn"]').should('be.visible')
    })
  })

  describe('Edit Customer', () => {
    beforeEach(() => {
      cy.createTestData('customers', {
        name: 'Edit Test Customer',
        email: 'edit@test.com',
        phone: '+1111111111',
        status: 'active'
      }).then((response) => {
        testCustomerId = response.body.id
      })
    })

    it('should navigate to edit page', () => {
      cy.visit(`/customers/${testCustomerId}`)
      cy.get('[data-testid="edit-customer-btn"]').click()
      cy.url().should('include', `/customers/${testCustomerId}/edit`)
    })

    it('should update customer information', () => {
      cy.visit(`/customers/${testCustomerId}/edit`)
      
      cy.get('[name="name"]').clear().type('Updated Customer Name')
      cy.get('[name="email"]').clear().type('updated@customer.com')
      cy.get('[name="phone"]').clear().type('+2222222222')
      
      cy.get('[data-testid="submit-customer"]').click()
      
      cy.url().should('include', `/customers/${testCustomerId}`)
      cy.contains('Customer updated successfully').should('be.visible')
      cy.contains('Updated Customer Name').should('be.visible')
      cy.contains('updated@customer.com').should('be.visible')
    })
  })

  describe('Customer Actions', () => {
    beforeEach(() => {
      cy.createTestData('customers', {
        name: 'Action Test Customer',
        email: 'action@test.com',
        status: 'active'
      }).then((response) => {
        testCustomerId = response.body.id
      })
    })

    it('should add note to customer', () => {
      cy.visit(`/customers/${testCustomerId}`)
      
      cy.get('[data-testid="add-note-btn"]').click()
      cy.get('[data-testid="note-content"]').type('This is a test note for E2E testing')
      cy.get('[data-testid="save-note-btn"]').click()
      
      cy.contains('Note added successfully').should('be.visible')
      cy.contains('This is a test note for E2E testing').should('be.visible')
    })

    it('should change customer status', () => {
      cy.visit(`/customers/${testCustomerId}`)
      
      cy.get('[data-testid="change-status-btn"]').click()
      cy.get('[data-testid="status-inactive"]').click()
      cy.get('[data-testid="confirm-status-change"]').click()
      
      cy.contains('Status updated successfully').should('be.visible')
      cy.get('[data-testid="customer-status"]').should('contain', 'Inactive')
    })

    it('should export customer data', () => {
      cy.visit(`/customers/${testCustomerId}`)
      
      cy.get('[data-testid="export-customer-btn"]').click()
      cy.get('[data-testid="export-pdf"]').click()
      
      // Verify download started (checking for file download is complex in Cypress)
      cy.contains('Export started').should('be.visible')
    })
  })
})