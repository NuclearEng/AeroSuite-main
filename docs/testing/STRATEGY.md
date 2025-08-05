# Testing Strategy

## Unit Tests
- Tool: Jest
- Goal: 85%+ coverage
- Command: `npm run test:unit`

## Integration Tests
- Tool: Jest + MongoDB Memory Server
- Command: `npm run test:integration`

## E2E Tests
- Tool: Cypress
- Command: `npm run test:e2e`

## Performance Tests
- Tool: k6
- Command: `npm run test:performance`

## Security Tests
- Tool: npm audit, OWASP ZAP
- Command: `npm run test:security`

Run `npm run test:all` before PRs. See CI for automated checks. 
