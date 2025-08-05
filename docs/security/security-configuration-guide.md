# AeroSuite Security Configuration Guide

This guide provides system administrators with detailed instructions for securely configuring and maintaining the AeroSuite platform in production environments.

## Table of Contents

1. [Initial Server Setup](#initial-server-setup)
2. [Network Security](#network-security)
3. [Application Security Configuration](#application-security-configuration)
4. [Database Security](#database-security)
5. [Authentication Configuration](#authentication-configuration)
6. [Logging and Monitoring](#logging-and-monitoring)
7. [Backup and Recovery](#backup-and-recovery)
8. [Updates and Patching](#updates-and-patching)
9. [Incident Response](#incident-response)
10. [Compliance](#compliance)

## Initial Server Setup

### Operating System Hardening

1. **Use a minimal server installation**
   - Install only necessary packages
   - Remove unused services and applications
   - Disable unnecessary system accounts

2. **User Management**
   - Create dedicated service accounts with least privilege
   - Disable root SSH access
   - Implement strong password policies
   - Use SSH key authentication instead of passwords

3. **File System Security**
   - Set appropriate file permissions
   - Use disk encryption for sensitive data
   - Implement file integrity monitoring

### Firewall Configuration

1. **Enable and configure host-based firewall**
   ```bash
   # Example for Ubuntu/Debian
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **Allow only necessary ports**
   - 22 (SSH) - restrict to admin IPs if possible
   - 80 (HTTP) - for redirect to HTTPS
   - 443 (HTTPS) - for application access
   - Application-specific ports as needed

## Network Security

### TLS/SSL Configuration

1. **Obtain and install certificates**
   - Use trusted CA-signed certificates
   - Configure automatic renewal
   - Implement OCSP stapling

2. **NGINX SSL Configuration**
   ```nginx
   server {
       listen 443 ssl http2;
       server_name example.com;
       
       ssl_certificate /path/to/fullchain.pem;
       ssl_certificate_key /path/to/privkey.pem;
       
       # Strong SSL settings
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_prefer_server_ciphers on;
       ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
       ssl_session_timeout 1d;
       ssl_session_cache shared:SSL:10m;
       ssl_session_tickets off;
       
       # HSTS
       add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
       
       # Other security headers
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header Content-Security-Policy "default-src 'self'; script-src 'self'; object-src 'none';" always;
       
       # ...rest of server configuration
   }
   
   # Redirect HTTP to HTTPS
   server {
       listen 80;
       server_name example.com;
       return 301 https://$host$request_uri;
   }
   ```

3. **Certificate Management**
   - Implement automated certificate renewal
   - Monitor certificate expiration
   - Use strong key sizes (RSA 2048+ or ECC 256+)

### Network Access Controls

1. **Implement network segmentation**
   - Separate application, database, and admin networks
   - Use VLANs or network security groups in cloud environments

2. **Configure Web Application Firewall (WAF)**
   - Protect against OWASP Top 10 vulnerabilities
   - Implement rate limiting
   - Block malicious IP addresses

3. **DDoS Protection**
   - Use cloud-based DDoS protection services
   - Implement rate limiting at load balancer level
   - Configure TCP/SYN cookies

## Application Security Configuration

### Environment Variables

1. **Sensitive Configuration**
   - Store secrets in environment variables, not in code
   - Use a secrets management solution in production
   - Example environment variables file (DO NOT commit to version control):

   ```bash
   # .env.production (example - DO NOT commit this file)
   NODE_ENV=production
   PORT=3000
   
   # Database
   DB_HOST=db.internal
   DB_PORT=5432
   DB_NAME=aerosuite_prod
   DB_USER=aerosuite_app
   DB_PASSWORD=strong-random-password
   
   # JWT
   JWT_SECRET=strong-random-secret
   JWT_EXPIRY=3600
   
   # API Keys
   API_KEY_EXTERNAL_SERVICE=your-api-key
   
   # Other Configuration
   CORS_ORIGINS=https://app.aerosuite.com,https://admin.aerosuite.com
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

2. **Secrets Management**
   - In production, use a dedicated secrets management service:
     - AWS Secrets Manager
     - HashiCorp Vault
     - Azure Key Vault
   - Rotate secrets regularly
   - Implement least privilege access to secrets

### Docker Configuration

1. **Secure Docker Settings**
   ```dockerfile
   # Example Dockerfile with security best practices
   FROM node:18-alpine AS base
   
   # Use non-root user
   RUN addgroup -g 1001 -S nodejs
   RUN adduser -S nodejs -u 1001 -G nodejs
   
   WORKDIR /app
   
   # Install dependencies
   COPY package*.json ./
   RUN npm ci --only=production
   
   # Copy application code
   COPY --chown=nodejs:nodejs . .
   
   # Set proper permissions
   RUN chmod -R 550 /app
   
   # Use non-root user
   USER nodejs
   
   # Expose only necessary port
   EXPOSE 3000
   
   # Run with Node.js best practices
   CMD ["node", "--no-deprecation", "server.js"]
   ```

2. **Docker Compose Security**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   
   services:
     app:
       build: .
       restart: unless-stopped
       read_only: true
       security_opt:
         - no-new-privileges:true
       cap_drop:
         - ALL
       environment:
         - NODE_ENV=production
         # Use environment variables or secrets
       networks:
         - app_network
       depends_on:
         - db
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
         interval: 30s
         timeout: 10s
         retries: 3
     
     db:
       image: postgres:14-alpine
       restart: unless-stopped
       volumes:
         - db_data:/var/lib/postgresql/data
       environment:
         - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
       secrets:
         - db_password
       networks:
         - app_network
   
   networks:
     app_network:
       driver: bridge
   
   volumes:
     db_data:
   
   secrets:
     db_password:
       file: ./secrets/db_password.txt
   ```

## Database Security

### PostgreSQL Configuration

1. **Authentication**
   - Use strong password authentication
   - Use SSL/TLS for database connections
   - Implement client certificate authentication for sensitive environments

2. **Access Control**
   - Create application-specific database users
   - Grant minimal necessary privileges
   - Example SQL for user setup:

   ```sql
   -- Create application user with limited privileges
   CREATE USER aerosuite_app WITH PASSWORD 'strong-password';
   
   -- Grant only necessary privileges
   GRANT CONNECT ON DATABASE aerosuite TO aerosuite_app;
   GRANT USAGE ON SCHEMA public TO aerosuite_app;
   
   -- Grant table-specific privileges
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aerosuite_app;
   GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO aerosuite_app;
   
   -- Set default privileges for future tables
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
   GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aerosuite_app;
   
   ALTER DEFAULT PRIVILEGES IN SCHEMA public
   GRANT USAGE ON SEQUENCES TO aerosuite_app;
   ```

3. **Database Hardening**
   - Edit postgresql.conf for security settings:

   ```
   # Network security
   listen_addresses = 'localhost'          # Listen only on localhost if possible
   ssl = on                                # Enable SSL
   ssl_cert_file = 'server.crt'            # SSL certificate
   ssl_key_file = 'server.key'             # SSL key
   
   # Authentication
   password_encryption = scram-sha-256     # Strong password hashing
   
   # Connection security
   max_connections = 100                   # Limit connections
   
   # Logging
   log_connections = on                    # Log connections
   log_disconnections = on                 # Log disconnections
   log_statement = 'ddl'                   # Log data definition changes
   ```

## Authentication Configuration

### JWT Configuration

1. **Secure JWT Settings**
   - Use RS256 (asymmetric) algorithm instead of HS256
   - Generate strong key pairs
   - Set short expiration times (1 hour or less)
   - Implement token rotation

2. **Key Generation Example**
   ```bash
   # Generate private key
   openssl genrsa -out private.pem 2048
   
   # Generate public key
   openssl rsa -in private.pem -outform PEM -pubout -out public.pem
   ```

3. **JWT Configuration Example**
   ```javascript
   // Example JWT configuration
   const jwt = require('jsonwebtoken');
   const fs = require('fs');
   
   const privateKey = fs.readFileSync('/path/to/private.pem');
   const publicKey = fs.readFileSync('/path/to/public.pem');
   
   // Sign token
   const token = jwt.sign(
     { 
       userId: user.id,
       role: user.role
     },
     privateKey,
     { 
       algorithm: 'RS256',
       expiresIn: '1h',
       issuer: 'aerosuite.com',
       audience: 'aerosuite-api'
     }
   );
   
   // Verify token
   try {
     const decoded = jwt.verify(token, publicKey, {
       algorithms: ['RS256'],
       issuer: 'aerosuite.com',
       audience: 'aerosuite-api'
     });
   } catch (err) {
     // Handle invalid token
   }
   ```

### OAuth Configuration

1. **OAuth Provider Setup**
   - Register application with OAuth providers
   - Use secure redirect URIs
   - Request minimal scopes
   - Store client secrets securely

2. **OAuth Security Best Practices**
   - Implement PKCE for authorization code flow
   - Validate state parameter
   - Verify token signatures and claims
   - Use short-lived access tokens

## Logging and Monitoring

### Centralized Logging

1. **ELK Stack Configuration**
   - Configure Filebeat to collect logs
   - Ship logs to Elasticsearch
   - Use Kibana for visualization
   - Set up log rotation and retention policies

2. **Log Security**
   - Encrypt log transport
   - Implement log integrity verification
   - Restrict access to logs
   - Redact sensitive information

### Security Monitoring

1. **Configure Alerts**
   - Set up alerts for suspicious activities:
     - Multiple failed login attempts
     - Unusual API usage patterns
     - Access from unusual locations
     - Privilege escalation attempts

2. **SIEM Integration**
   - Forward security-relevant logs to SIEM
   - Configure correlation rules
   - Implement automated responses

## Backup and Recovery

### Backup Strategy

1. **Database Backups**
   - Implement automated daily backups
   - Store backups in multiple locations
   - Encrypt backup data
   - Test restoration regularly

2. **Application Backups**
   - Back up application configuration
   - Back up user-uploaded content
   - Document backup and restore procedures

### Disaster Recovery

1. **Recovery Plan**
   - Document step-by-step recovery procedures
   - Define Recovery Time Objectives (RTO)
   - Define Recovery Point Objectives (RPO)
   - Test recovery procedures regularly

## Updates and Patching

### System Updates

1. **OS Patching Strategy**
   - Implement automated security updates
   - Schedule regular maintenance windows
   - Test patches in staging environment first

2. **Application Updates**
   - Maintain CI/CD pipeline for rapid deployment
   - Implement blue/green deployment for zero downtime
   - Include automated security testing in deployment pipeline

### Dependency Management

1. **Dependency Updates**
   - Regularly update dependencies
   - Subscribe to security advisories
   - Implement automated dependency scanning
   - Test thoroughly before updating production

## Incident Response

### Incident Response Plan

1. **Response Procedures**
   - Define incident severity levels
   - Document response procedures for each level
   - Establish communication channels
   - Define roles and responsibilities

2. **Containment and Recovery**
   - Document containment procedures
   - Prepare recovery scripts and procedures
   - Establish forensic investigation process

## Compliance

### Compliance Documentation

1. **Maintain Records**
   - Document security controls
   - Record security incidents and responses
   - Keep audit logs for required retention periods
   - Document compliance with relevant standards

2. **Regular Audits**
   - Schedule regular security audits
   - Address findings promptly
   - Update security controls as needed

---

## Quick Reference

### Essential Security Commands

```bash
# Check open ports
sudo netstat -tulpn

# Check running services
systemctl list-units --type=service --state=running

# Check system logs for security events
sudo journalctl -p err..emerg

# Check failed login attempts
sudo lastb

# Check file permissions
find /path/to/app -type f -exec ls -l {} \;

# Check SSL certificate
openssl x509 -in certificate.crt -text -noout

# Test TLS configuration
nmap --script ssl-enum-ciphers -p 443 example.com
```

### Security Configuration Checklist

- [ ] Operating system hardened
- [ ] Firewall configured
- [ ] TLS/SSL properly configured
- [ ] Network segmentation implemented
- [ ] Environment variables securely managed
- [ ] Docker containers securely configured
- [ ] Database access properly restricted
- [ ] JWT/OAuth securely configured
- [ ] Centralized logging implemented
- [ ] Security monitoring and alerts configured
- [ ] Backup strategy implemented and tested
- [ ] Update and patching processes established
- [ ] Incident response plan documented
- [ ] Compliance requirements addressed

## Additional Resources

- [AeroSuite Security Practices Guide](./security-practices-guide.md)
- [NIST SP 800-53 Security Controls](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks/)
- [OWASP Secure Configuration Guide](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/02-Configuration_and_Deployment_Management_Testing/) 
