describe('Inspections', () => {
  let testInspectionId
  let testSupplierId

  beforeEach(() => {
    cy.login()
    
    // Create a test supplier for inspections
    cy.createTestData('suppliers', {
      name: 'Test Supplier for Inspections',
      email: 'inspection.supplier@test.com',
      status: 'active'
    }).then((response) => {
      testSupplierId = response.body.id
    })
    
    cy.visit('/inspections')
  })

  afterEach(() => {
    if (testInspectionId) {
      cy.cleanupTestData('inspections', testInspectionId)
      testInspectionId = null
    }
    if (testSupplierId) {
      cy.cleanupTestData('suppliers', testSupplierId)
      testSupplierId = null
    }
  })

  describe('Inspections List', () => {
    it('should display inspections table', () => {
      cy.get('[data-testid="inspections-table"]').should('be.visible')
      cy.get('thead').within(() => {
        cy.contains('ID').should('be.visible')
        cy.contains('Date').should('be.visible')
        cy.contains('Supplier').should('be.visible')
        cy.contains('Status').should('be.visible')
        cy.contains('Inspector').should('be.visible')
      })
    })

    it('should filter inspections by status', () => {
      cy.get('[data-testid="status-filter"]').click()
      cy.get('[data-value="pending"]').click()
      
      cy.get('[data-testid="inspection-status"]').each(($status) => {
        cy.wrap($status).should('contain', 'Pending')
      })
    })

    it('should filter inspections by date range', () => {
      cy.get('[data-testid="date-range-filter"]').click()
      cy.get('[data-testid="start-date"]').type('2024-01-01')
      cy.get('[data-testid="end-date"]').type('2024-12-31')
      cy.get('[data-testid="apply-date-filter"]').click()
      
      cy.get('[data-testid="inspection-date"]').should('be.visible')
    })

    it('should search inspections', () => {
      cy.get('[data-testid="search-inspections"]').type('quality')
      cy.get('[data-testid="search-button"]').click()
      
      cy.get('tbody tr').should('have.length.at.least', 0)
    })
  })

  describe('Create Inspection', () => {
    it('should navigate to create inspection form', () => {
      cy.get('[data-testid="create-inspection-btn"]').click()
      cy.url().should('include', '/inspections/new')
      cy.contains('New Inspection').should('be.visible')
    })

    it('should validate required fields', () => {
      cy.visit('/inspections/new')
      cy.get('[data-testid="submit-inspection"]').click()
      
      cy.get('[data-testid="supplier-error"]').should('contain', 'Supplier is required')
      cy.get('[data-testid="date-error"]').should('contain', 'Inspection date is required')
      cy.get('[data-testid="type-error"]').should('contain', 'Inspection type is required')
    })

    it('should create new inspection successfully', () => {
      cy.visit('/inspections/new')
      
      // Fill form
      cy.get('[data-testid="supplier-select"]').click()
      cy.get(`[data-value="${testSupplierId}"]`).click()
      
      cy.get('[name="inspectionDate"]').type('2024-12-31')
      cy.get('[data-testid="inspection-type"]').click()
      cy.get('[data-value="quality"]').click()
      
      cy.get('[name="productName"]').type('Test Product')
      cy.get('[name="batchNumber"]').type('BATCH-001')
      cy.get('[name="quantity"]').type('100')
      cy.get('[name="notes"]').type('Initial inspection for E2E testing')
      
      cy.get('[data-testid="submit-inspection"]').click()
      
      cy.url().should('match', /\/inspections\/\d+/)
      cy.contains('Inspection created successfully').should('be.visible')
      
      // Store ID for cleanup
      cy.url().then((url) => {
        testInspectionId = url.split('/').pop()
      })
    })
  })

  describe('Inspection Details', () => {
    beforeEach(() => {
      cy.createTestData('inspections', {
        supplierId: testSupplierId,
        inspectionDate: '2024-12-31',
        type: 'quality',
        status: 'pending',
        productName: 'Test Product Details',
        batchNumber: 'BATCH-002'
      }).then((response) => {
        testInspectionId = response.body.id
      })
    })

    it('should display inspection information', () => {
      cy.visit(`/inspections/${testInspectionId}`)
      
      cy.contains('Test Product Details').should('be.visible')
      cy.contains('BATCH-002').should('be.visible')
      cy.get('[data-testid="inspection-status"]').should('contain', 'Pending')
    })

    it('should display inspection checklist', () => {
      cy.visit(`/inspections/${testInspectionId}`)
      
      cy.get('[data-testid="checklist-tab"]').click()
      cy.get('[data-testid="checklist-items"]').should('be.visible')
      cy.get('[data-testid="checklist-item"]').should('have.length.at.least', 1)
    })

    it('should allow adding inspection results', () => {
      cy.visit(`/inspections/${testInspectionId}`)
      
      cy.get('[data-testid="add-result-btn"]').click()
      cy.get('[name="parameter"]').type('Weight')
      cy.get('[name="expectedValue"]').type('100g')
      cy.get('[name="actualValue"]').type('99.5g')
      cy.get('[name="status"]').select('pass')
      
      cy.get('[data-testid="save-result"]').click()
      cy.contains('Result added successfully').should('be.visible')
    })
  })

  describe('Complete Inspection', () => {
    beforeEach(() => {
      cy.createTestData('inspections', {
        supplierId: testSupplierId,
        inspectionDate: '2024-12-31',
        type: 'quality',
        status: 'in_progress',
        productName: 'Test Product Complete',
        batchNumber: 'BATCH-003'
      }).then((response) => {
        testInspectionId = response.body.id
      })
    })

    it('should mark checklist items as completed', () => {
      cy.visit(`/inspections/${testInspectionId}`)
      cy.get('[data-testid="checklist-tab"]').click()
      
      cy.get('[data-testid="checklist-item"]').first().within(() => {
        cy.get('[data-testid="check-item"]').click()
        cy.get('[data-testid="result-select"]').select('pass')
        cy.get('[data-testid="comments"]').type('Meets requirements')
      })
      
      cy.get('[data-testid="save-checklist"]').click()
      cy.contains('Checklist updated').should('be.visible')
    })

    it('should complete inspection with final report', () => {
      cy.visit(`/inspections/${testInspectionId}`)
      
      cy.get('[data-testid="complete-inspection-btn"]').click()
      cy.get('[data-testid="overall-result"]').select('pass')
      cy.get('[data-testid="final-comments"]').type('All quality parameters met')
      cy.get('[data-testid="inspector-signature"]').type('John Inspector')
      
      cy.get('[data-testid="submit-completion"]').click()
      
      cy.contains('Inspection completed successfully').should('be.visible')
      cy.get('[data-testid="inspection-status"]').should('contain', 'Completed')
    })
  })

  describe('Inspection Reports', () => {
    beforeEach(() => {
      cy.createTestData('inspections', {
        supplierId: testSupplierId,
        inspectionDate: '2024-12-31',
        type: 'quality',
        status: 'completed',
        productName: 'Test Product Report',
        batchNumber: 'BATCH-004'
      }).then((response) => {
        testInspectionId = response.body.id
      })
    })

    it('should generate inspection report', () => {
      cy.visit(`/inspections/${testInspectionId}`)
      
      cy.get('[data-testid="generate-report-btn"]').click()
      cy.get('[data-testid="report-format"]').select('pdf')
      cy.get('[data-testid="generate-btn"]').click()
      
      cy.contains('Report generation started').should('be.visible')
    })

    it('should email inspection report', () => {
      cy.visit(`/inspections/${testInspectionId}`)
      
      cy.get('[data-testid="email-report-btn"]').click()
      cy.get('[data-testid="recipient-email"]').type('recipient@test.com')
      cy.get('[data-testid="email-subject"]').should('have.value', 'Inspection Report - BATCH-004')
      cy.get('[data-testid="send-email-btn"]').click()
      
      cy.contains('Report sent successfully').should('be.visible')
    })
  })

  describe('Bulk Operations', () => {
    it('should select multiple inspections', () => {
      cy.get('[data-testid="select-all-inspections"]').click()
      cy.get('[data-testid="bulk-actions"]').should('be.visible')
    })

    it('should export selected inspections', () => {
      cy.get('[data-testid="inspection-checkbox"]').first().click()
      cy.get('[data-testid="inspection-checkbox"]').eq(1).click()
      
      cy.get('[data-testid="bulk-actions"]').click()
      cy.get('[data-testid="bulk-export"]').click()
      
      cy.contains('Export started for 2 inspections').should('be.visible')
    })
  })
})