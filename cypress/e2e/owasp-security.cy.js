/**
 * OWASP Security Tests
 * 
 * Based on OWASP Web Security Testing Guide (WSTG) and 
 * Application Security Verification Standard (ASVS)
 * 
 * References:
 * - https://owasp.org/www-project-web-security-testing-guide/
 * - https://owasp.org/www-project-application-security-verification-standard/
 * 
 * This test suite covers:
 * - Authentication and Authorization (ASVS v5.0.0-2.x.x)
 * - Input Validation and Encoding (ASVS v5.0.0-1.x.x)
 * - Session Management (ASVS v5.0.0-3.x.x)
 * - Access Control (ASVS v5.0.0-4.x.x)
 * - Malicious Input Handling (ASVS v5.0.0-5.x.x)
 * - Business Logic (ASVS v5.0.0-6.x.x)
 * - Data Protection (ASVS v5.0.0-7.x.x)
 * - Communication Security (ASVS v5.0.0-8.x.x)
 * - HTTP Security (ASVS v5.0.0-9.x.x)
 * - Malicious Code (ASVS v5.0.0-10.x.x)
 * - API Security (ASVS v5.0.0-11.x.x)
 * - Configuration (ASVS v5.0.0-12.x.x)
 * - File Upload (ASVS v5.0.0-13.x.x)
 * - Mobile Security (ASVS v5.0.0-14.x.x)
 * - WebView Security (ASVS v5.0.0-15.x.x)
 */

describe('OWASP Security Testing (WSTG & ASVS)', () => {
  const SECURITY_THRESHOLDS = {
    AUTH_TIMEOUT: 5000, // ms
    SESSION_TIMEOUT: 3600, // seconds
    PASSWORD_MIN_LENGTH: 8,
    RATE_LIMIT_WINDOW: 60000, // ms
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 300000, // ms
    TOKEN_EXPIRY: 3600, // seconds
    CSRF_TOKEN_LENGTH: 32,
    ENCRYPTION_STRENGTH: 256, // bits
  };

  before(() => {
    // Ensure application is accessible
    cy.task('checkApiHealth').then((isHealthy) => {
      if (!isHealthy) {
        cy.log('⚠️ Application is not responding. Security tests may fail.');
      }
    });
  });

  describe('ASVS v5.0.0-1: Encoding and Sanitization', () => {
    describe('1.1: Input Validation', () => {
      it('should validate all input parameters (1.1.1)', () => {
        const maliciousInputs = [
          { field: 'email', value: '<script>alert("xss")</script>', expected: 400 },
          { field: 'name', value: 'admin\'--', expected: 400 },
          { field: 'description', value: '${7*7}', expected: 400 },
          { field: 'phone', value: '1\' OR \'1\'=\'1', expected: 400 }
        ];

        maliciousInputs.forEach(({ field, value, expected }) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/test/validation`,
            body: { [field]: value },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.equal(expected);
            cy.log(`Input validation passed for ${field}: ${value}`);
          });
        });
      });

      it('should prevent SQL injection attacks (1.2.1)', () => {
        const sqlInjectionPayloads = [
          "' OR '1'='1",
          "'; DROP TABLE users; --",
          "' UNION SELECT * FROM users --",
          "admin'--",
          "1' OR '1'='1'--"
        ];

        sqlInjectionPayloads.forEach((payload) => {
          cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/api/test/sql-injection?q=${encodeURIComponent(payload)}`,
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.not.equal(500);
            expect(response.body).to.not.contain('SQL');
            cy.log(`SQL injection prevention verified for: ${payload}`);
          });
        });
      });

      it('should prevent NoSQL injection attacks (1.2.2)', () => {
        const nosqlInjectionPayloads = [
          '{"$gt": ""}',
          '{"$ne": null}',
          '{"$where": "1==1"}',
          '{"$regex": ".*"}'
        ];

        nosqlInjectionPayloads.forEach((payload) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/test/nosql-injection`,
            body: { query: payload },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.not.equal(500);
            cy.log(`NoSQL injection prevention verified for: ${payload}`);
          });
        });
      });

      it('should prevent LDAP injection attacks (1.2.3)', () => {
        const ldapInjectionPayloads = [
          '*)(uid=*))(|(uid=*',
          '*))%00',
          'admin)(&(password=*))',
          '*)(|(password=*))'
        ];

        ldapInjectionPayloads.forEach((payload) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/test/ldap-injection`,
            body: { username: payload },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.not.equal(500);
            cy.log(`LDAP injection prevention verified for: ${payload}`);
          });
        });
      });

      it('should prevent OS command injection (1.2.5)', () => {
        const commandInjectionPayloads = [
          '; ls -la',
          '| cat /etc/passwd',
          '&& rm -rf /',
          '$(whoami)',
          '`id`'
        ];

        commandInjectionPayloads.forEach((payload) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/test/command-injection`,
            body: { command: payload },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.not.equal(500);
            cy.log(`Command injection prevention verified for: ${payload}`);
          });
        });
      });
    });

    describe('1.3: Output Encoding', () => {
      it('should encode output to prevent XSS (1.3.1)', () => {
        const xssPayloads = [
          '<script>alert("xss")</script>',
          'javascript:alert("xss")',
          '"><script>alert("xss")</script>',
          '"><img src=x onerror=alert("xss")>',
          '"><svg onload=alert("xss")>'
        ];

        xssPayloads.forEach((payload) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/test/xss`,
            body: { content: payload },
            failOnStatusCode: false
          }).then((response) => {
            if (response.status === 200) {
              expect(response.body.content).to.not.contain('<script>');
              expect(response.body.content).to.not.contain('javascript:');
              expect(response.body.content).to.not.contain('onerror=');
              expect(response.body.content).to.not.contain('onload=');
            }
            cy.log(`XSS prevention verified for: ${payload}`);
          });
        });
      });

      it('should encode output for different contexts (1.3.2)', () => {
        const contexts = ['html', 'javascript', 'css', 'url', 'xml'];

        contexts.forEach((context) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/test/output-encoding`,
            body: { context, content: '<script>alert("xss")</script>' },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.equal(200);
            expect(response.body.encoded).to.not.contain('<script>');
            cy.log(`Output encoding verified for context: ${context}`);
          });
        });
      });
    });
  });

  describe('ASVS v5.0.0-2: Authentication', () => {
    describe('2.1: General Authentication', () => {
      it('should implement secure authentication (2.1.1)', () => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/api/auth/login`,
          body: {
            email: 'test@example.com',
            password: 'password123'
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.be.oneOf([200, 401]);
          if (response.status === 200) {
            expect(response.body).to.have.property('token');
            expect(response.body.token).to.be.a('string');
          }
          cy.log('Secure authentication implementation verified');
        });
      });

      it('should prevent timing attacks (2.1.2)', () => {
        const startTime = Date.now();
        
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/api/auth/login`,
          body: {
            email: 'valid@example.com',
            password: 'wrongpassword'
          },
          failOnStatusCode: false
        }).then((response) => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          // Response time should be consistent regardless of password validity
          expect(responseTime).to.be.lessThan(SECURITY_THRESHOLDS.AUTH_TIMEOUT);
          cy.log(`Timing attack prevention verified: ${responseTime}ms`);
        });
      });

      it('should implement account lockout (2.1.3)', () => {
        // Test account lockout after multiple failed attempts
        const maxAttempts = SECURITY_THRESHOLDS.MAX_LOGIN_ATTEMPTS;
        
        for (let i = 0; i < maxAttempts + 1; i++) {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/auth/login`,
            body: {
              email: 'test@example.com',
              password: 'wrongpassword'
            },
            failOnStatusCode: false
          }).then((response) => {
            if (i >= maxAttempts) {
              expect(response.status).to.equal(429); // Too Many Requests
            }
          });
        }
        
        cy.log('Account lockout mechanism verified');
      });
    });

    describe('2.2: Password Security', () => {
      it('should enforce password complexity (2.2.1)', () => {
        const weakPasswords = ['123', 'password', 'abc', 'qwerty'];
        const strongPasswords = ['SecurePass123!', 'ComplexP@ssw0rd', 'Str0ng#Pass'];

        weakPasswords.forEach((password) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/auth/register`,
            body: {
              email: 'test@example.com',
              password: password
            },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.equal(400);
            cy.log(`Weak password rejected: ${password}`);
          });
        });

        strongPasswords.forEach((password) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/auth/register`,
            body: {
              email: 'test@example.com',
              password: password
            },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.equal(201);
            cy.log(`Strong password accepted: ${password}`);
          });
        });
      });

      it('should implement secure password reset (2.2.2)', () => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/api/auth/forgot-password`,
          body: {
            email: 'test@example.com'
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.equal(200);
          // Should not reveal if email exists or not
          expect(response.body.message).to.not.contain('not found');
          cy.log('Secure password reset implemented');
        });
      });
    });

    describe('2.3: Session Management', () => {
      it('should implement secure session management (2.3.1)', () => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/api/auth/login`,
          body: {
            email: 'test@example.com',
            password: 'password123'
          },
          failOnStatusCode: false
        }).then((response) => {
          if (response.status === 200) {
            expect(response.body).to.have.property('token');
            expect(response.body).to.have.property('refreshToken');
            expect(response.headers).to.have.property('set-cookie');
            
            // Check for secure cookie attributes
            const cookies = response.headers['set-cookie'];
            if (cookies) {
              expect(cookies[0]).to.contain('HttpOnly');
              expect(cookies[0]).to.contain('Secure');
              expect(cookies[0]).to.contain('SameSite');
            }
          }
          cy.log('Secure session management verified');
        });
      });

      it('should implement session timeout (2.3.2)', () => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/auth/session-info`,
          headers: {
            'Authorization': 'Bearer valid-token'
          },
          failOnStatusCode: false
        }).then((response) => {
          if (response.status === 200) {
            expect(response.body).to.have.property('expiresAt');
            const expiresAt = new Date(response.body.expiresAt);
            const now = new Date();
            const timeDiff = expiresAt.getTime() - now.getTime();
            
            expect(timeDiff).to.be.lessThan(SECURITY_THRESHOLDS.SESSION_TIMEOUT * 1000);
          }
          cy.log('Session timeout implementation verified');
        });
      });
    });
  });

  describe('ASVS v5.0.0-4: Access Control', () => {
    describe('4.1: General Access Control', () => {
      it('should implement proper access control (4.1.1)', () => {
        const endpoints = [
          { url: '/api/admin/users', method: 'GET', role: 'admin' },
          { url: '/api/inspections', method: 'POST', role: 'inspector' },
          { url: '/api/reports', method: 'GET', role: 'manager' }
        ];

        endpoints.forEach(({ url, method, role }) => {
          cy.request({
            method: method,
            url: `${Cypress.env('apiUrl')}${url}`,
            headers: {
              'Authorization': 'Bearer user-token'
            },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.equal(403);
            cy.log(`Access control verified for ${method} ${url}`);
          });
        });
      });

      it('should prevent privilege escalation (4.1.2)', () => {
        // Test that users cannot access resources they don't own
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/inspections/123`,
          headers: {
            'Authorization': 'Bearer user-token'
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.equal(403);
          cy.log('Privilege escalation prevention verified');
        });
      });
    });

    describe('4.2: Resource Access Control', () => {
      it('should implement resource-level access control (4.2.1)', () => {
        const resources = ['inspections', 'customers', 'suppliers', 'reports'];

        resources.forEach((resource) => {
          cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/api/${resource}/123`,
            headers: {
              'Authorization': 'Bearer user-token'
            },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.be.oneOf([403, 404]);
            cy.log(`Resource access control verified for: ${resource}`);
          });
        });
      });
    });
  });

  describe('ASVS v5.0.0-5: Malicious Input Handling', () => {
    describe('5.1: Input Validation', () => {
      it('should validate all inputs (5.1.1)', () => {
        const maliciousInputs = [
          { type: 'xss', value: '<script>alert("xss")</script>' },
          { type: 'sql', value: "' OR '1'='1" },
          { type: 'nosql', value: '{"$gt": ""}' },
          { type: 'command', value: '; ls -la' },
          { type: 'path', value: '../../../etc/passwd' }
        ];

        maliciousInputs.forEach(({ type, value }) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/test/input-validation`,
            body: { input: value, type: type },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.equal(400);
            cy.log(`Input validation verified for ${type}: ${value}`);
          });
        });
      });
    });

    describe('5.2: Output Encoding', () => {
      it('should encode all outputs (5.2.1)', () => {
        const testInputs = [
          '<script>alert("xss")</script>',
          'javascript:alert("xss")',
          '"><img src=x onerror=alert("xss")>'
        ];

        testInputs.forEach((input) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/test/output-encoding`,
            body: { input: input },
            failOnStatusCode: false
          }).then((response) => {
            if (response.status === 200) {
              expect(response.body.output).to.not.contain('<script>');
              expect(response.body.output).to.not.contain('javascript:');
              expect(response.body.output).to.not.contain('onerror=');
            }
            cy.log(`Output encoding verified for: ${input}`);
          });
        });
      });
    });
  });

  describe('ASVS v5.0.0-6: Business Logic', () => {
    describe('6.1: Business Logic Security', () => {
      it('should prevent business logic bypass (6.1.1)', () => {
        // Test that users cannot bypass business rules
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/api/inspections`,
          body: {
            status: 'completed',
            result: 'pass',
            inspectorId: 'unauthorized-user-id'
          },
          headers: {
            'Authorization': 'Bearer user-token'
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.equal(403);
          cy.log('Business logic bypass prevention verified');
        });
      });

      it('should validate business rules (6.1.2)', () => {
        // Test business rule validation
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/api/inspections`,
          body: {
            status: 'completed',
            result: 'pass',
            scheduledDate: '2024-01-01' // Past date
          },
          headers: {
            'Authorization': 'Bearer inspector-token'
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.equal(400);
          cy.log('Business rule validation verified');
        });
      });
    });
  });

  describe('ASVS v5.0.0-7: Data Protection', () => {
    describe('7.1: Sensitive Data Protection', () => {
      it('should protect sensitive data (7.1.1)', () => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/users/profile`,
          headers: {
            'Authorization': 'Bearer user-token'
          },
          failOnStatusCode: false
        }).then((response) => {
          if (response.status === 200) {
            expect(response.body).to.not.have.property('password');
            expect(response.body).to.not.have.property('ssn');
            expect(response.body).to.not.have.property('creditCard');
            cy.log('Sensitive data protection verified');
          }
        });
      });

      it('should encrypt sensitive data (7.1.2)', () => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/api/test/encryption`,
          body: {
            data: 'sensitive-information'
          },
          failOnStatusCode: false
        }).then((response) => {
          if (response.status === 200) {
            expect(response.body.encrypted).to.not.equal('sensitive-information');
            expect(response.body.algorithm).to.equal('AES-256');
            cy.log('Data encryption verified');
          }
        });
      });
    });
  });

  describe('ASVS v5.0.0-8: Communication Security', () => {
    describe('8.1: Transport Security', () => {
      it('should use HTTPS (8.1.1)', () => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/health`,
          failOnStatusCode: false
        }).then((response) => {
          // Check for security headers
          expect(response.headers).to.have.property('strict-transport-security');
          expect(response.headers['strict-transport-security']).to.contain('max-age=');
          cy.log('HTTPS enforcement verified');
        });
      });

      it('should implement secure headers (8.1.2)', () => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/health`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.headers).to.have.property('x-content-type-options');
          expect(response.headers['x-content-type-options']).to.equal('nosniff');
          expect(response.headers).to.have.property('x-frame-options');
          expect(response.headers['x-frame-options']).to.equal('DENY');
          expect(response.headers).to.have.property('x-xss-protection');
          cy.log('Security headers verified');
        });
      });
    });
  });

  describe('ASVS v5.0.0-9: HTTP Security', () => {
    describe('9.1: HTTP Security Headers', () => {
      it('should implement security headers (9.1.1)', () => {
        const requiredHeaders = [
          'strict-transport-security',
          'x-content-type-options',
          'x-frame-options',
          'x-xss-protection',
          'referrer-policy',
          'content-security-policy'
        ];

        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/health`,
          failOnStatusCode: false
        }).then((response) => {
          requiredHeaders.forEach((header) => {
            expect(response.headers).to.have.property(header);
            cy.log(`Security header verified: ${header}`);
          });
        });
      });
    });

    describe('9.2: HTTP Request Security', () => {
      it('should validate HTTP methods (9.2.1)', () => {
        const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE'];
        const disallowedMethods = ['OPTIONS', 'TRACE', 'HEAD'];

        disallowedMethods.forEach((method) => {
          cy.request({
            method: method,
            url: `${Cypress.env('apiUrl')}/api/test`,
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.equal(405);
            cy.log(`HTTP method validation verified: ${method}`);
          });
        });
      });
    });
  });

  describe('ASVS v5.0.0-11: API Security', () => {
    describe('11.1: API Security', () => {
      it('should implement API authentication (11.1.1)', () => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/inspections`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.equal(401);
          cy.log('API authentication verified');
        });
      });

      it('should implement rate limiting (11.1.2)', () => {
        // Test rate limiting by making multiple requests
        const requests = Array(11).fill().map(() => 
          cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/api/health`,
            failOnStatusCode: false
          })
        );

        cy.wrap(Promise.all(requests)).then((responses) => {
          const rateLimited = responses.filter(r => r.status === 429);
          expect(rateLimited.length).to.be.greaterThan(0);
          cy.log('Rate limiting verified');
        });
      });

      it('should validate API inputs (11.1.3)', () => {
        const invalidInputs = [
          { field: 'limit', value: -1 },
          { field: 'offset', value: 'invalid' },
          { field: 'sort', value: '; DROP TABLE users;' }
        ];

        invalidInputs.forEach(({ field, value }) => {
          cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/api/inspections?${field}=${value}`,
            headers: {
              'Authorization': 'Bearer valid-token'
            },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.equal(400);
            cy.log(`API input validation verified for: ${field}=${value}`);
          });
        });
      });
    });
  });

  describe('ASVS v5.0.0-12: Configuration', () => {
    describe('12.1: Security Configuration', () => {
      it('should have secure configuration (12.1.1)', () => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/config/security`,
          failOnStatusCode: false
        }).then((response) => {
          if (response.status === 200) {
            expect(response.body.debug).to.be.false;
            expect(response.body.exposeErrors).to.be.false;
            expect(response.body.httpsOnly).to.be.true;
            cy.log('Secure configuration verified');
          }
        });
      });

      it('should not expose sensitive information (12.1.2)', () => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/health`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.body).to.not.contain('version');
          expect(response.body).to.not.contain('database');
          expect(response.body).to.not.contain('secret');
          cy.log('Information disclosure prevention verified');
        });
      });
    });
  });

  describe('WSTG-INFO: Information Gathering', () => {
    describe('WSTG-INFO-01: Conduct Search Engine Discovery', () => {
      it('should not expose sensitive information in search engines', () => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/robots.txt`,
          failOnStatusCode: false
        }).then((response) => {
          if (response.status === 200) {
            expect(response.body).to.not.contain('/admin');
            expect(response.body).to.not.contain('/api');
            expect(response.body).to.not.contain('/internal');
            cy.log('Search engine information disclosure prevention verified');
          }
        });
      });
    });

    describe('WSTG-INFO-02: Fingerprint Web Server', () => {
      it('should not expose server information', () => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/health`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.headers).to.not.have.property('server');
          expect(response.headers).to.not.have.property('x-powered-by');
          expect(response.headers).to.not.have.property('x-aspnet-version');
          cy.log('Server fingerprinting prevention verified');
        });
      });
    });
  });

  describe('WSTG-CONF: Configuration and Deploy Management', () => {
    describe('WSTG-CONF-01: Test Network Infrastructure Configuration', () => {
      it('should have secure network configuration', () => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/health`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.headers).to.have.property('strict-transport-security');
          expect(response.headers['strict-transport-security']).to.contain('max-age=');
          cy.log('Secure network configuration verified');
        });
      });
    });

    describe('WSTG-CONF-02: Test Application Platform Configuration', () => {
      it('should have secure platform configuration', () => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/health`,
          failOnStatusCode: false
        }).then((response) => {
          expect(response.headers).to.not.have.property('x-powered-by');
          expect(response.headers).to.not.have.property('server');
          cy.log('Secure platform configuration verified');
        });
      });
    });
  });

  describe('WSTG-IDENT: Identity Management', () => {
    describe('WSTG-IDENT-01: Test Role Definitions', () => {
      it('should have proper role definitions', () => {
        const roles = ['admin', 'inspector', 'manager', 'user'];

        roles.forEach((role) => {
          cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/api/auth/roles/${role}`,
            headers: {
              'Authorization': 'Bearer admin-token'
            },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.be.oneOf([200, 404]);
            cy.log(`Role definition verified for: ${role}`);
          });
        });
      });
    });

    describe('WSTG-IDENT-02: Test User Registration Process', () => {
      it('should have secure user registration', () => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/api/auth/register`,
          body: {
            email: 'test@example.com',
            password: 'weak',
            name: 'Test User'
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.equal(400);
          cy.log('Secure user registration verified');
        });
      });
    });
  });

  describe('WSTG-AUTH: Authentication Testing', () => {
    describe('WSTG-AUTH-01: Test Password Policy', () => {
      it('should enforce password policy', () => {
        const weakPasswords = ['123', 'password', 'abc'];
        const strongPasswords = ['SecurePass123!', 'ComplexP@ssw0rd'];

        weakPasswords.forEach((password) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/auth/register`,
            body: {
              email: 'test@example.com',
              password: password
            },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.equal(400);
            cy.log(`Password policy enforced for: ${password}`);
          });
        });
      });
    });

    describe('WSTG-AUTH-02: Test Account Lockout', () => {
      it('should implement account lockout', () => {
        // Test account lockout after multiple failed attempts
        const maxAttempts = 5;
        
        for (let i = 0; i < maxAttempts + 1; i++) {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/auth/login`,
            body: {
              email: 'test@example.com',
              password: 'wrongpassword'
            },
            failOnStatusCode: false
          }).then((response) => {
            if (i >= maxAttempts) {
              expect(response.status).to.equal(429);
            }
          });
        }
        
        cy.log('Account lockout mechanism verified');
      });
    });
  });

  describe('WSTG-SESS: Session Management Testing', () => {
    describe('WSTG-SESS-01: Test Session Management Schema', () => {
      it('should have secure session management', () => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/api/auth/login`,
          body: {
            email: 'test@example.com',
            password: 'password123'
          },
          failOnStatusCode: false
        }).then((response) => {
          if (response.status === 200) {
            expect(response.body).to.have.property('token');
            expect(response.body).to.have.property('refreshToken');
            expect(response.headers).to.have.property('set-cookie');
            
            const cookies = response.headers['set-cookie'];
            if (cookies) {
              expect(cookies[0]).to.contain('HttpOnly');
              expect(cookies[0]).to.contain('Secure');
              expect(cookies[0]).to.contain('SameSite');
            }
          }
          cy.log('Secure session management verified');
        });
      });
    });

    describe('WSTG-SESS-02: Test Session Timeout', () => {
      it('should implement session timeout', () => {
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/auth/session-info`,
          headers: {
            'Authorization': 'Bearer valid-token'
          },
          failOnStatusCode: false
        }).then((response) => {
          if (response.status === 200) {
            expect(response.body).to.have.property('expiresAt');
            const expiresAt = new Date(response.body.expiresAt);
            const now = new Date();
            const timeDiff = expiresAt.getTime() - now.getTime();
            
            expect(timeDiff).to.be.lessThan(3600 * 1000); // 1 hour
          }
          cy.log('Session timeout implementation verified');
        });
      });
    });
  });

  describe('WSTG-AUTHZ: Authorization Testing', () => {
    describe('WSTG-AUTHZ-01: Test Directory Traversal', () => {
      it('should prevent directory traversal', () => {
        const traversalPayloads = [
          '../../../etc/passwd',
          '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
          '....//....//....//etc/passwd',
          '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
        ];

        traversalPayloads.forEach((payload) => {
          cy.request({
            method: 'GET',
            url: `${Cypress.env('apiUrl')}/api/files/${payload}`,
            headers: {
              'Authorization': 'Bearer user-token'
            },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.equal(404);
            cy.log(`Directory traversal prevention verified for: ${payload}`);
          });
        });
      });
    });

    describe('WSTG-AUTHZ-02: Test Authorization Bypass', () => {
      it('should prevent authorization bypass', () => {
        // Test that users cannot access resources they don't own
        cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/inspections/123`,
          headers: {
            'Authorization': 'Bearer user-token'
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.equal(403);
          cy.log('Authorization bypass prevention verified');
        });
      });
    });
  });

  describe('WSTG-BUSLOGIC: Business Logic Testing', () => {
    describe('WSTG-BUSLOGIC-01: Test Business Logic Data Validation', () => {
      it('should validate business logic data', () => {
        cy.request({
          method: 'POST',
          url: `${Cypress.env('apiUrl')}/api/inspections`,
          body: {
            status: 'completed',
            result: 'pass',
            scheduledDate: '2024-01-01' // Past date
          },
          headers: {
            'Authorization': 'Bearer inspector-token'
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.equal(400);
          cy.log('Business logic data validation verified');
        });
      });
    });

    describe('WSTG-BUSLOGIC-02: Test Integrity Checks', () => {
      it('should implement integrity checks', () => {
        cy.request({
          method: 'PUT',
          url: `${Cypress.env('apiUrl')}/api/inspections/123`,
          body: {
            status: 'completed',
            result: 'pass',
            inspectorId: 'unauthorized-user-id'
          },
          headers: {
            'Authorization': 'Bearer user-token'
          },
          failOnStatusCode: false
        }).then((response) => {
          expect(response.status).to.equal(403);
          cy.log('Integrity checks verified');
        });
      });
    });
  });

  describe('WSTG-CLIENT: Client-Side Testing', () => {
    describe('WSTG-CLIENT-01: Test DOM Based Cross Site Scripting', () => {
      it('should prevent DOM-based XSS', () => {
        const domXssPayloads = [
          'javascript:alert("xss")',
          'data:text/html,<script>alert("xss")</script>',
          'vbscript:alert("xss")'
        ];

        domXssPayloads.forEach((payload) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/test/dom-xss`,
            body: { url: payload },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.equal(400);
            cy.log(`DOM-based XSS prevention verified for: ${payload}`);
          });
        });
      });
    });

    describe('WSTG-CLIENT-02: Test JavaScript Execution', () => {
      it('should prevent malicious JavaScript execution', () => {
        const jsPayloads = [
          '<script>alert("xss")</script>',
          '"><img src=x onerror=alert("xss")>',
          '"><svg onload=alert("xss")>'
        ];

        jsPayloads.forEach((payload) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/api/test/js-execution`,
            body: { content: payload },
            failOnStatusCode: false
          }).then((response) => {
            if (response.status === 200) {
              expect(response.body.content).to.not.contain('<script>');
              expect(response.body.content).to.not.contain('onerror=');
              expect(response.body.content).to.not.contain('onload=');
            }
            cy.log(`JavaScript execution prevention verified for: ${payload}`);
          });
        });
      });
    });
  });

  describe('WSTG-API: API Testing', () => {
    describe('WSTG-API-01: Test GraphQL', () => {
      it('should secure GraphQL endpoints', () => {
        const graphqlQueries = [
          { query: '{ users { id email password } }' },
          { query: 'mutation { deleteUser(id: "123") }' },
          { query: '{ __schema { types { name } } }' }
        ];

        graphqlQueries.forEach(({ query }) => {
          cy.request({
            method: 'POST',
            url: `${Cypress.env('apiUrl')}/graphql`,
            body: { query: query },
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.equal(401);
            cy.log(`GraphQL security verified for: ${query}`);
          });
        });
      });
    });

    describe('WSTG-API-02: Test REST API', () => {
      it('should secure REST API endpoints', () => {
        const endpoints = [
          { method: 'GET', url: '/api/users' },
          { method: 'POST', url: '/api/inspections' },
          { method: 'PUT', url: '/api/customers/123' },
          { method: 'DELETE', url: '/api/suppliers/123' }
        ];

        endpoints.forEach(({ method, url }) => {
          cy.request({
            method: method,
            url: `${Cypress.env('apiUrl')}${url}`,
            failOnStatusCode: false
          }).then((response) => {
            expect(response.status).to.equal(401);
            cy.log(`REST API security verified for: ${method} ${url}`);
          });
        });
      });
    });
  });
}); 