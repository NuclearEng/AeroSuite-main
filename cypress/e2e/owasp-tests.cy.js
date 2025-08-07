/**
 * Combined OWASP Security Tests
 * 
 * This test suite covers the OWASP Top 10 security risks:
 * 1. Broken Access Control
 * 2. Cryptographic Failures
 * 3. Injection
 * 4. Insecure Design
 * 5. Security Misconfiguration
 * 6. Vulnerable and Outdated Components
 * 7. Identification and Authentication Failures
 * 8. Software and Data Integrity Failures
 * 9. Security Logging and Monitoring Failures
 * 10. Server-Side Request Forgery
 */

describe('OWASP Security Tests', () => {
  beforeEach(() => {
    // Set up test environment
    cy.visit('/');
  });

  describe('A01:2021 – Broken Access Control', () => {
    it('should prevent unauthorized access to protected resources', () => {
      cy.task('testAccessControl').then((result) => {
        expect(result.unauthorizedAccess).to.equal(0);
        expect(result.roleEnforcement).to.be.true;
      });
    });

    it('should enforce proper authorization checks', () => {
      // Try accessing admin page as regular user
      cy.login('user@example.com', 'password123');
      cy.visit('/admin');
      cy.url().should('not.include', '/admin');
      cy.url().should('include', '/unauthorized');
    });

    it('should prevent path traversal attacks', () => {
      cy.task('testDirectoryTraversalPrevention').then((result) => {
        expect(result.vulnerable).to.be.false;
      });
    });

    it('should prevent IDOR (Insecure Direct Object Reference) attacks', () => {
      cy.login('user@example.com', 'password123');
      
      // Try to access another user's data
      cy.request({
        url: '/api/users/2',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.equal(403);
      });
    });
  });

  describe('A02:2021 – Cryptographic Failures', () => {
    it('should use HTTPS for all connections', () => {
      cy.task('testSecurityHeaders').then((headers) => {
        expect(headers['strict-transport-security']).to.exist;
      });
    });

    it('should encrypt sensitive data at rest', () => {
      cy.task('testEncryption').then((result) => {
        expect(result.sensitiveDataEncrypted).to.be.true;
      });
    });

    it('should use secure password hashing', () => {
      cy.task('testEncryption').then((result) => {
        expect(result.passwordHashAlgorithm).to.be.oneOf(['bcrypt', 'argon2', 'PBKDF2']);
      });
    });

    it('should not expose sensitive data in responses', () => {
      cy.login('user@example.com', 'password123');
      cy.request('/api/user/profile').then((response) => {
        expect(response.body).to.not.have.property('password');
        expect(response.body).to.not.have.property('passwordHash');
      });
    });
  });

  describe('A03:2021 – Injection', () => {
    it('should prevent SQL injection attacks', () => {
      cy.task('testSQLInjectionPrevention').then((result) => {
        expect(result.vulnerable).to.be.false;
      });
    });

    it('should prevent XSS (Cross-Site Scripting) attacks', () => {
      cy.task('testXSSPrevention').then((result) => {
        expect(result.vulnerable).to.be.false;
      });
      
      // Test input sanitization
      cy.login('user@example.com', 'password123');
      cy.visit('/profile');
      cy.get('input[name="name"]').clear().type('<script>alert("XSS")</script>');
      cy.get('button[type="submit"]').click();
      
      // Check that the script tag is escaped
      cy.visit('/profile');
      cy.get('body').should('not.contain', '<script>alert("XSS")</script>');
    });

    it('should prevent NoSQL injection attacks', () => {
      cy.login('user@example.com', 'password123');
      
      // Test NoSQL injection in search
      cy.visit('/users');
      cy.get('input[name="search"]').type('{"$gt": ""}');
      cy.get('button[type="submit"]').click();
      
      // Should not return all users
      cy.get('[data-testid="user-item"]').should('have.length.lessThan', 10);
    });

    it('should prevent command injection attacks', () => {
      cy.login('admin@example.com', 'admin123');
      
      // Test command injection in admin console
      cy.visit('/admin/console');
      cy.get('input[name="command"]').type('ls; rm -rf /');
      cy.get('button[type="submit"]').click();
      
      // Should show error
      cy.get('[data-testid="error-message"]').should('be.visible');
    });
  });

  describe('A04:2021 – Insecure Design', () => {
    it('should implement proper rate limiting', () => {
      cy.task('testRateLimiting').then((result) => {
        expect(result.rateLimit).to.be.greaterThan(0);
        expect(result.rateLimitEnforced).to.be.true;
      });
    });

    it('should implement proper input validation', () => {
      cy.task('testInputValidation').then((result) => {
        expect(result.validationImplemented).to.be.true;
      });
    });

    it('should implement proper business logic security', () => {
      cy.task('testBusinessLogicSecurity').then((result) => {
        expect(result.securityControls).to.be.greaterThan(0);
      });
    });
  });

  describe('A05:2021 – Security Misconfiguration', () => {
    it('should not expose sensitive information in error messages', () => {
      cy.visit('/trigger-error');
      cy.get('body').should('not.contain', 'SQL syntax');
      cy.get('body').should('not.contain', 'stack trace');
      cy.get('body').should('not.contain', '/var/www');
    });

    it('should have proper security headers', () => {
      cy.task('testSecurityHeaders').then((headers) => {
        expect(headers['content-security-policy']).to.exist;
        expect(headers['x-content-type-options']).to.exist;
        expect(headers['x-frame-options']).to.exist;
        expect(headers['strict-transport-security']).to.exist;
      });
    });

    it('should not expose directory listings', () => {
      cy.request({
        url: '/js/',
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.be.oneOf([403, 404]);
      });
    });
  });

  describe('A06:2021 – Vulnerable and Outdated Components', () => {
    it('should not use vulnerable dependencies', () => {
      cy.task('testSecurityScan').then((result) => {
        expect(result.highVulnerabilities).to.equal(0);
        expect(result.criticalVulnerabilities).to.equal(0);
      });
    });
  });

  describe('A07:2021 – Identification and Authentication Failures', () => {
    it('should enforce strong password policies', () => {
      cy.visit('/register');
      
      // Test weak password
      cy.get('input[name="email"]').type('test@example.com');
      cy.get('input[name="password"]').type('123');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="error-message"]').should('be.visible');
      
      // Test strong password
      cy.get('input[name="password"]').clear().type('StrongP@ss123');
      cy.get('button[type="submit"]').click();
      cy.get('[data-testid="error-message"]').should('not.exist');
    });

    it('should implement account lockout after failed attempts', () => {
      cy.task('testAuthenticationSecurity').then((result) => {
        expect(result.accountLockout).to.be.true;
        expect(result.maxFailedAttempts).to.be.lessThan(10);
      });
    });

    it('should implement multi-factor authentication', () => {
      cy.task('testAuthenticationSecurity').then((result) => {
        expect(result.mfaAvailable).to.be.true;
      });
    });

    it('should use secure session management', () => {
      cy.task('testSessionManagement').then((result) => {
        expect(result.secureCookies).to.be.true;
        expect(result.httpOnlyCookies).to.be.true;
        expect(result.sameSiteCookies).to.be.true;
      });
    });
  });

  describe('A08:2021 – Software and Data Integrity Failures', () => {
    it('should verify integrity of updates', () => {
      cy.task('testJWTSecurity').then((result) => {
        expect(result.signatureVerification).to.be.true;
      });
    });

    it('should prevent CSRF attacks', () => {
      cy.task('testCSRFProtection').then((result) => {
        expect(result.csrfProtection).to.be.true;
      });
      
      // Check for CSRF token in forms
      cy.login('user@example.com', 'password123');
      cy.visit('/profile');
      cy.get('form').then($form => {
        const formHtml = $form.html();
        expect(formHtml).to.match(/csrf|_token|xsrf/i);
      });
    });
  });

  describe('A09:2021 – Security Logging and Monitoring Failures', () => {
    it('should log security events', () => {
      cy.task('testAuditLogging').then((result) => {
        expect(result.auditEvents).to.be.an('array');
        expect(result.auditEvents.length).to.be.greaterThan(0);
      });
    });

    it('should log authentication events', () => {
      cy.login('user@example.com', 'password123');
      cy.task('testAuditLogging').then((result) => {
        const authEvents = result.auditEvents.filter(e => e.type === 'authentication');
        expect(authEvents.length).to.be.greaterThan(0);
      });
    });

    it('should log authorization events', () => {
      cy.login('user@example.com', 'password123');
      cy.visit('/admin');
      cy.task('testAuditLogging').then((result) => {
        const authzEvents = result.auditEvents.filter(e => e.type === 'authorization');
        expect(authzEvents.length).to.be.greaterThan(0);
      });
    });
  });

  describe('A10:2021 – Server-Side Request Forgery', () => {
    it('should prevent SSRF attacks', () => {
      cy.login('admin@example.com', 'admin123');
      
      // Test SSRF in URL input
      cy.visit('/admin/fetch-url');
      cy.get('input[name="url"]').type('http://localhost:8080');
      cy.get('button[type="submit"]').click();
      
      // Should show error
      cy.get('[data-testid="error-message"]').should('be.visible');
    });
  });
});
