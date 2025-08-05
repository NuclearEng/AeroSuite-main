describe('Suppliers', () => {
  let testSupplierId

  beforeEach(() => {
    cy.login()
    cy.visit('/suppliers')
  })

  afterEach(() => {
    if (testSupplierId) {
      cy.cleanupTestData('suppliers', testSupplierId)
      testSupplierId = null
    }
  })

  describe('Suppliers List', () => {
    it('should display suppliers table', () => {
      cy.get('[data-testid="suppliers-table"]').should('be.visible')
      cy.get('table thead').should('be.visible')
      cy.get('table tbody tr').should('have.length.at.least', 1)
    })

    it('should search suppliers', () => {
      cy.get('[data-testid="search-suppliers"]').type('test')
      cy.get('table tbody tr').each(($row) => {
        cy.wrap($row).should('contain.text', 'test')
      })
    })

    it('should sort suppliers by name', () => {
      cy.get('[data-testid="sort-name"]').click()
      let previousName = ''
      cy.get('table tbody tr td:first-child').each(($cell) => {
        const currentName = $cell.text()
        if (previousName) {
          expect(currentName.localeCompare(previousName)).to.be.at.least(0)
        }
        previousName = currentName
      })
    })

    it('should filter suppliers by status', () => {
      cy.get('[data-testid="filter-status"]').click()
      cy.get('[data-value="active"]').click()
      cy.get('[data-testid="supplier-status"]').each(($status) => {
        cy.wrap($status).should('contain', 'Active')
      })
    })
  })

  describe('Create Supplier', () => {
    it('should navigate to create supplier form', () => {
      cy.get('[data-testid="add-supplier-btn"]').click()
      cy.url().should('include', '/suppliers/new')
      cy.get('form').should('be.visible')
    })

    it('should validate required fields', () => {
      cy.visit('/suppliers/new')
      cy.get('[data-testid="submit-supplier"]').click()
      cy.get('.error-message').should('contain', 'Name is required')
      cy.get('.error-message').should('contain', 'Email is required')
    })

    it('should create new supplier successfully', () => {
      cy.visit('/suppliers/new')
      
      // Fill form
      cy.get('[name="name"]').type('Test Supplier E2E')
      cy.get('[name="email"]').type('test@supplier.com')
      cy.get('[name="phone"]').type('+1234567890')
      cy.get('[name="address"]').type('123 Test Street')
      cy.get('[name="city"]').type('Test City')
      cy.get('[name="country"]').type('Test Country')
      cy.get('[name="contactPerson"]').type('John Doe')
      
      // Submit
      cy.get('[data-testid="submit-supplier"]').click()
      
      // Verify redirect and success
      cy.url().should('match', /\/suppliers\/\d+/)
      cy.contains('Supplier created successfully').should('be.visible')
      
      // Store ID for cleanup
      cy.url().then((url) => {
        testSupplierId = url.split('/').pop()
      })
    })
  })

  describe('Edit Supplier', () => {
    beforeEach(() => {
      // Create test supplier
      cy.createTestData('suppliers', {
        name: 'Edit Test Supplier',
        email: 'edit@test.com',
        phone: '+1234567890',
        status: 'active'
      }).then((response) => {
        testSupplierId = response.body.id
      })
    })

    it('should navigate to edit form', () => {
      cy.visit(`/suppliers/${testSupplierId}`)
      cy.get('[data-testid="edit-supplier-btn"]').click()
      cy.url().should('include', `/suppliers/${testSupplierId}/edit`)
    })

    it('should update supplier successfully', () => {
      cy.visit(`/suppliers/${testSupplierId}/edit`)
      
      cy.get('[name="name"]').clear().type('Updated Supplier Name')
      cy.get('[name="email"]').clear().type('updated@email.com')
      
      cy.get('[data-testid="submit-supplier"]').click()
      
      cy.url().should('include', `/suppliers/${testSupplierId}`)
      cy.contains('Supplier updated successfully').should('be.visible')
      cy.contains('Updated Supplier Name').should('be.visible')
    })
  })

  describe('Supplier Details', () => {
    beforeEach(() => {
      cy.createTestData('suppliers', {
        name: 'Detail Test Supplier',
        email: 'detail@test.com',
        phone: '+1234567890',
        status: 'active',
        qualityScore: 85
      }).then((response) => {
        testSupplierId = response.body.id
      })
    })

    it('should display supplier information', () => {
      cy.visit(`/suppliers/${testSupplierId}`)
      
      cy.contains('Detail Test Supplier').should('be.visible')
      cy.contains('detail@test.com').should('be.visible')
      cy.contains('+1234567890').should('be.visible')
      cy.get('[data-testid="quality-score"]').should('contain', '85')
    })

    it('should display supplier performance metrics', () => {
      cy.visit(`/suppliers/${testSupplierId}`)
      
      cy.get('[data-testid="performance-tab"]').click()
      cy.get('[data-testid="delivery-rate"]').should('be.visible')
      cy.get('[data-testid="defect-rate"]').should('be.visible')
      cy.get('[data-testid="response-time"]').should('be.visible')
    })

    it('should display supplier documents', () => {
      cy.visit(`/suppliers/${testSupplierId}`)
      
      cy.get('[data-testid="documents-tab"]').click()
      cy.get('[data-testid="upload-document-btn"]').should('be.visible')
    })
  })

  describe('Delete Supplier', () => {
    beforeEach(() => {
      cy.createTestData('suppliers', {
        name: 'Delete Test Supplier',
        email: 'delete@test.com',
        status: 'inactive'
      }).then((response) => {
        testSupplierId = response.body.id
      })
    })

    it('should delete supplier with confirmation', () => {
      cy.visit(`/suppliers/${testSupplierId}`)
      
      cy.get('[data-testid="delete-supplier-btn"]').click()
      cy.get('[data-testid="confirm-delete"]').should('be.visible')
      cy.get('[data-testid="confirm-delete-yes"]').click()
      
      cy.url().should('include', '/suppliers')
      cy.contains('Supplier deleted successfully').should('be.visible')
      
      // Clear ID since it's already deleted
      testSupplierId = null
    })
  })
})