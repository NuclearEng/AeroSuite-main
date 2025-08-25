describe('Dashboard', () => {
  it('loads successfully', () => {
    cy.visit('/');
    cy.contains('Dashboard');
  });
});
