# Secure Coding Practices

## Module Overview

This module focuses on practical secure coding techniques and best practices for preventing common security vulnerabilities. It provides language-specific guidance for the technologies used in AeroSuite.

## Learning Objectives

By the end of this module, you will be able to:

1. Identify common coding patterns that lead to security vulnerabilities
2. Apply secure coding practices to prevent security issues
3. Use secure coding techniques specific to JavaScript, Node.js, and React
4. Implement proper input validation and output encoding
5. Recognize and avoid security anti-patterns

## Topics Covered

### 1. General Secure Coding Principles

- **Input Validation**: Validating all input from untrusted sources
- **Output Encoding**: Context-appropriate encoding of output data
- **Parameterized Queries**: Preventing injection attacks
- **Error Handling**: Secure error handling without information leakage
- **Memory Management**: Preventing memory-related vulnerabilities
- **Concurrency**: Thread-safe programming practices

### 2. JavaScript Security

- **JavaScript Security Model**: Same-origin policy, CSP, and other browser protections
- **Common JavaScript Vulnerabilities**: Prototype pollution, DOM-based XSS, etc.
- **Secure JavaScript Patterns**: Safe coding patterns for JavaScript
- **JavaScript Security Libraries**: Tools and libraries for secure JavaScript development
- **ES6+ Security Considerations**: Security aspects of modern JavaScript features

### 3. Node.js Security

- **Node.js Security Architecture**: Event loop, modules, and security boundaries
- **Common Node.js Vulnerabilities**: Command injection, path traversal, etc.
- **Secure Express.js Patterns**: Best practices for Express.js applications
- **Dependency Management**: Managing and securing npm dependencies
- **Node.js Security Modules**: Security-focused modules and tools

### 4. React Security

- **React Security Model**: XSS protection in React
- **Secure State Management**: Redux, Context API, and state security
- **React Router Security**: Secure routing and navigation
- **Component Security**: Building secure and reusable components
- **React Hooks Security**: Security considerations with React Hooks

### 5. Database Security

- **MongoDB Security**: Secure MongoDB usage patterns
- **SQL Injection Prevention**: Parameterized queries and ORM usage
- **Database Authentication**: Secure connection and authentication
- **Data Access Controls**: Implementing proper access controls
- **Database Encryption**: Encrypting sensitive data

### 6. API Security

- **RESTful API Security**: Securing REST endpoints
- **GraphQL Security**: Preventing GraphQL-specific vulnerabilities
- **API Authentication**: JWT, OAuth, and other authentication methods
- **API Authorization**: Implementing proper authorization checks
- **API Rate Limiting**: Preventing abuse and DoS attacks

## Hands-on Exercises

### Exercise 1: Vulnerability Remediation

Fix security vulnerabilities in provided code samples:
- XSS vulnerability in a React component
- SQL injection in a database query
- Insecure JWT implementation
- Path traversal vulnerability

### Exercise 2: Secure Code Review

Perform a security-focused code review on a component of AeroSuite and identify potential security issues.

### Exercise 3: Secure Feature Implementation

Implement a new feature with security built-in from the start, applying secure coding practices.

## Code Examples

### Insecure vs. Secure JavaScript

```javascript
// INSECURE: Vulnerable to XSS
function displayUserInput(input) {
  document.getElementById('output').innerHTML = input;
}

// SECURE: Prevents XSS
function displayUserInput(input) {
  document.getElementById('output').textContent = input;
}
```

### Insecure vs. Secure Node.js

```javascript
// INSECURE: Vulnerable to command injection
app.get('/execute', (req, res) => {
  const cmd = req.query.command;
  exec(cmd, (error, stdout, stderr) => {
    res.send(stdout);
  });
});

// SECURE: Prevents command injection
app.get('/execute', (req, res) => {
  const allowedCommands = ['ls', 'pwd', 'echo'];
  const cmd = req.query.command;
  
  if (!allowedCommands.includes(cmd)) {
    return res.status(403).send('Command not allowed');
  }
  
  exec(cmd, { shell: false }, (error, stdout, stderr) => {
    res.send(stdout);
  });
});
```

### Insecure vs. Secure React

```jsx
// INSECURE: Vulnerable to XSS
function Comment({ data }) {
  return <div dangerouslySetInnerHTML={{ __html: data.comment }} />;
}

// SECURE: Prevents XSS
function Comment({ data }) {
  return <div>{data.comment}</div>;
}
```

### Insecure vs. Secure MongoDB

```javascript
// INSECURE: Vulnerable to NoSQL injection
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.collection('users').findOne({
    username: username,
    password: password
  });
  // ...
});

// SECURE: Prevents NoSQL injection
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  // Validate input
  if (!isValidUsername(username) || !isValidPassword(password)) {
    return res.status(400).send('Invalid input');
  }
  
  const user = await db.collection('users').findOne({
    username: username
  });
  
  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).send('Invalid credentials');
  }
  // ...
});
```

## Assessment

1. Multiple-choice questions on secure coding principles
2. Code review exercise to identify security vulnerabilities
3. Practical coding exercise to implement secure code
4. Short answer questions on language-specific security considerations

## Resources

- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Node.js Security Best Practices](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [React Security](https://reactjs.org/docs/security.html)
- [AeroSuite Developer Security Checklist](../developer-security-checklist.md)

## Next Steps

After completing this module, proceed to [Authentication & Authorization](03-authentication-authorization.md) to learn about implementing secure authentication and authorization mechanisms. 
