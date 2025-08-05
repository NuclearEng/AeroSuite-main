# AeroSuite Developer Guide

This guide provides comprehensive information for developers working on the AeroSuite project. It covers the architecture, technologies, development workflow, and best practices.

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Organization](#code-organization)
- [Testing](#testing)
- [Performance Considerations](#performance-considerations)
- [Security Guidelines](#security-guidelines)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Project Overview

AeroSuite is a quality management system for aerospace manufacturers and suppliers. It provides tools for:

- Supplier management and qualification
- Inspection planning and execution
- Quality data analysis and reporting
- Document management
- Customer relationship management

The application consists of a React-based frontend and a Node.js/Express backend with a MongoDB database.

## Architecture

AeroSuite follows a service-oriented architecture with clear separation of concerns:

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  React Client   │◄────►│  Express API    │◄────►│   MongoDB DB    │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        │                        │                        │
        │                        │                        │
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│ Redux/Contexts  │      │Service Modules  │      │   Collections   │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
```

### Core Architectural Principles

1. **Separation of Concerns**: Each component has a specific responsibility
2. **Modularity**: The system is divided into independent, interchangeable modules
3. **API-First Design**: All functionality is exposed through a well-defined API
4. **Scalability**: Components can be independently scaled as needed
5. **Security by Design**: Security is integrated throughout the development lifecycle

## Technology Stack

### Frontend
- **Framework**: React (Create React App)
- **State Management**: Redux Toolkit
- **UI Library**: Material-UI (MUI)
- **Data Fetching**: React Query
- **Forms**: Formik with Yup validation
- **Testing**: Jest, React Testing Library
- **Data Visualization**: Chart.js, D3.js
- **Routing**: React Router

### Backend
- **Runtime**: Node.js
- **Web Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Testing**: Jest, Supertest
- **Documentation**: OpenAPI/Swagger
- **Monitoring**: Prometheus/Grafana

### DevOps
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus, Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- MongoDB (v5 or later)
- Docker and Docker Compose (for containerized development)
- Git

### Local Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/aerosuite.git
   cd aerosuite
   ```

2. Install dependencies:
   ```bash
   npm install
   cd client
   npm install
   cd ..
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. Start the development server:
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Start only backend
   npm run server:dev
   
   # Start only frontend
   npm run client:dev
   ```

5. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs

### Docker Development

For containerized development:

```bash
docker-compose up -d
```

This will start the application and all dependencies in Docker containers.

## Development Workflow

### Branching Strategy

We follow a GitFlow-inspired branching strategy:

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches
- `release/*`: Release preparation branches
- `hotfix/*`: Hot fixes for production

### Task Workflow

1. **Task Assignment**: Tasks are assigned in the task tracking system
2. **Branch Creation**: Create a feature branch from `develop`
3. **Development**: Implement the task with appropriate tests
4. **Testing**: Ensure all tests pass locally
5. **Code Review**: Submit a pull request for review
6. **Integration**: Merge to `develop` after approval
7. **Release**: Include in a release branch for deployment

### Code Style and Linting

The project uses ESLint and Prettier for code formatting and linting:

```bash
# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types include: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

Example:
```
feat(auth): add two-factor authentication

Implements Google Authenticator integration for 2FA
```

## Code Organization

### Frontend Structure

```
client/
├── public/           # Static assets
├── src/
│   ├── assets/       # Images, icons, etc.
│   │   ├── common/   # Common components
│   │   ├── layout/   # Layout components
│   │   └── ...       # Feature-specific components
│   ├── hooks/        # Custom React hooks
│   ├── pages/        # Page components
│   ├── redux/        # Redux state management
│   │   ├── slices/   # Redux Toolkit slices
│   │   └── store.js  # Redux store configuration
│   ├── services/     # API services
│   ├── utils/        # Utility functions
│   ├── App.tsx       # Main App component
│   └── index.tsx     # Application entry point
```

### Backend Structure

```
server/
├── src/
│   ├── config/       # Configuration
│   ├── controllers/  # Request handlers
│   ├── middleware/   # Express middleware
│   ├── models/       # Mongoose models
│   ├── routes/       # API routes
│   │   ├── v1/       # API v1 routes
│   │   └── v2/       # API v2 routes
│   ├── services/     # Business logic
│   ├── utils/        # Utility functions
│   ├── docs/         # API documentation
│   ├── app.js        # Express application
│   └── index.js      # Server entry point
```

## Testing

### Testing Philosophy

AeroSuite follows a comprehensive testing strategy:

1. **Unit Testing**: Test individual functions and components
2. **Integration Testing**: Test interactions between components
3. **End-to-End Testing**: Test complete user flows
4. **Performance Testing**: Test system performance
5. **Security Testing**: Test for vulnerabilities

### Frontend Testing

The frontend uses Jest and React Testing Library for component testing:

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

Testing components follows this pattern:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    renderWithProviders(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Backend Testing

The backend uses Jest and Supertest for API testing:

```bash
# Run all tests
npm test

# Run integration tests only
npm run test:integration

# Run unit tests only
npm run test:unit
```

### End-to-End Testing

End-to-end tests use Cypress:

```bash
# Open Cypress test runner
npm run cy:open

# Run Cypress tests headlessly
npm run cy:run
```

## Performance Considerations

### Frontend Performance

1. **Code Splitting**: Use dynamic imports for route-based code splitting
2. **Memoization**: Use React.memo, useMemo, and useCallback where appropriate
3. **Virtualization**: Use virtualized lists for large datasets
4. **Image Optimization**: Optimize images and use responsive images
5. **Bundle Size**: Monitor bundle size with source-map-explorer

### Backend Performance

1. **Database Indexes**: Ensure proper indexes for frequently queried fields
2. **Query Optimization**: Use projection and pagination for large result sets
3. **Caching**: Implement Redis caching for frequently accessed data
4. **Connection Pooling**: Use connection pooling for database connections
5. **Compression**: Enable response compression

### Performance Monitoring

Use the built-in performance monitoring tools:

```bash
# Run performance tests
npm run perf

# Generate performance report
npm run perf:report
```

## Security Guidelines

### Authentication and Authorization

- Use JWT tokens for authentication
- Implement role-based access control
- Use proper password hashing (bcrypt)
- Implement two-factor authentication for sensitive operations

### Data Protection

- Validate and sanitize all user inputs
- Use parameterized queries to prevent injection attacks
- Encrypt sensitive data in transit and at rest
- Implement proper error handling to avoid information leakage

### API Security

- Use HTTPS for all communications
- Implement rate limiting to prevent abuse
- Use security headers (Helmet middleware)
- Validate content types and request sizes

### Security Testing

Regular security testing includes:

```bash
# Run security audit
npm run security-scan

# Check for vulnerabilities in dependencies
npm run security-scan:deps

# OWASP Top 10 compliance check
npm run security-scan:owasp
```

## Deployment

### Environments

The project supports multiple deployment environments:

- **Development**: For ongoing development work
- **Testing**: For quality assurance
- **Staging**: Pre-production environment
- **Production**: Live environment

### Deployment Process

1. **Build**: Create optimized production build
   ```bash
   npm run build
   ```

2. **Containerization**: Build Docker images
   ```bash
   docker build -t aerosuite-client ./client
   docker build -t aerosuite-server ./server
   ```

3. **Kubernetes Deployment**: Deploy to Kubernetes cluster
   ```bash
   kubectl apply -f k8s/overlays/prod
   ```

### Continuous Integration/Deployment

The project uses GitHub Actions for CI/CD:

- **Pull Request**: Run tests and linting
- **Merge to Develop**: Build and deploy to dev environment
- **Release**: Build and deploy to staging
- **Promotion**: Deploy to production

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check MongoDB connection string
   - Verify network connectivity
   - Check MongoDB service status

2. **Build Failures**
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules: `rm -rf node_modules`
   - Reinstall dependencies: `npm install`

3. **Authentication Issues**
   - Check JWT secret configuration
   - Verify token expiration settings
   - Check for clock skew between services

### Debugging

1. **Backend Debugging**
   - Use `debug` npm package with DEBUG environment variable
   - Check server logs in `/logs` directory
   - Use Node.js inspector: `node --inspect src/index.js`

2. **Frontend Debugging**
   - Use React Developer Tools browser extension
   - Check browser console for errors
   - Use Redux DevTools for state debugging

### Getting Help

If you encounter issues that aren't covered here:

1. Check the issue tracker for similar problems
2. Ask in the developer Slack channel
3. Contact the core development team

## Additional Resources

- [API Documentation](api-documentation.md)
- [Frontend Component Tests](frontend-component-tests.md)
- [Integration Tests](integration-tests.md)
- [Performance Optimization](performance-optimizations/README.md)
- [Security Best Practices](security/README.md) 
