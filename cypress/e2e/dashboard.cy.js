describe('Dashboard', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/dashboard')
  })

  describe('Dashboard Layout', () => {
    it('should display main dashboard components', () => {
      cy.get('[data-testid="dashboard-header"]').should('be.visible')
      cy.get('[data-testid="dashboard-stats"]').should('be.visible')
      cy.get('[data-testid="dashboard-charts"]').should('be.visible')
      cy.get('[data-testid="recent-activities"]').should('be.visible')
    })

    it('should display navigation menu', () => {
      cy.get('[data-testid="nav-menu"]').should('be.visible')
      cy.get('[data-testid="nav-dashboard"]').should('have.class', 'active')
    })
  })

  describe('Dashboard Stats', () => {
    it('should display key metrics', () => {
      cy.get('[data-testid="total-inspections"]').should('be.visible')
      cy.get('[data-testid="pending-tasks"]').should('be.visible')
      cy.get('[data-testid="active-suppliers"]').should('be.visible')
      cy.get('[data-testid="quality-score"]').should('be.visible')
    })

    it('should refresh stats on demand', () => {
      cy.get('[data-testid="refresh-stats"]').click()
      cy.get('[data-testid="loading-spinner"]').should('be.visible')
      cy.get('[data-testid="loading-spinner"]').should('not.exist')
    })
  })

  describe('Dashboard Charts', () => {
    it('should render performance charts', () => {
      cy.get('[data-testid="performance-chart"]').should('be.visible')
      cy.get('canvas').should('exist')
    })

    it('should allow time range selection', () => {
      cy.get('[data-testid="time-range-selector"]').click()
      cy.get('[data-value="7days"]').click()
      cy.get('[data-testid="performance-chart"]').should('contain', 'Last 7 Days')
    })
  })

  describe('Recent Activities', () => {
    it('should display recent activities list', () => {
      cy.get('[data-testid="activity-list"]').should('be.visible')
      cy.get('[data-testid="activity-item"]').should('have.length.at.least', 1)
    })

    it('should filter activities by type', () => {
      cy.get('[data-testid="activity-filter"]').click()
      cy.get('[data-value="inspections"]').click()
      cy.get('[data-testid="activity-item"]').each(($el) => {
        cy.wrap($el).should('contain', 'inspection')
      })
    })
  })

  describe('Quick Actions', () => {
    it('should navigate to create inspection', () => {
      cy.get('[data-testid="quick-action-inspection"]').click()
      cy.url().should('include', '/inspections/new')
    })

    it('should navigate to add supplier', () => {
      cy.get('[data-testid="quick-action-supplier"]').click()
      cy.url().should('include', '/suppliers/new')
    })
  })
})