# AeroSuite - Enterprise Aviation Management Platform

A comprehensive full-stack aerospace management platform built with React, Node.js, and MongoDB.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the backend server
cd server && npm run dev

# In a new terminal, start the frontend
cd client && npm start

# Access the application at http://localhost:3000
```

## 🏗️ Architecture

- **Frontend**: React 18 with TypeScript, Material-UI
- **Backend**: Node.js, Express, MongoDB
- **Authentication**: JWT with SSO and 2FA support
- **Monitoring**: Grafana + Prometheus
- **Security**: OWASP compliant with automated security scanning
- **Deployment**: Docker, Kubernetes, Load balancing
- **API**: RESTful with versioning and comprehensive documentation

## 🌟 Features

### Core Functionality
- **Dashboard**: Interactive aerospace management dashboard
- **Task Management**: Kanban board with drag-and-drop
- **Supplier Management**: Comprehensive supplier tracking
- **Customer Management**: Customer database and analytics
- **Inspection Management**: Quality control and auditing
- **Reporting**: Advanced analytics and reporting

### Enterprise Features
- **Containerization**: Docker + Kubernetes deployment
- **Monitoring**: Grafana dashboards + Prometheus metrics
- **Security**: OWASP compliance + API security scanning
- **Performance**: Load testing + optimization tools
- **CI/CD**: Automated testing + deployment pipelines
- **Scalability**: Microservices architecture
- **Documentation**: Comprehensive enterprise documentation

## 📁 Project Structure

```
AeroSuite/
├── client/                   # React.js frontend
│   ├── src/                 # Source code
│   ├── public/              # Static assets
│   └── package.json         # Frontend dependencies
├── server/                   # Node.js backend
│   ├── src/                 # Source code
│   ├── logs/                # Application logs
│   └── package.json         # Backend dependencies
├── docker-compose.yml        # Container orchestration
├── monitoring/               # Grafana + Prometheus configs
├── scripts/                  # Automation scripts
├── docs/                     # Documentation
└── package.json             # Root dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Docker (for Enterprise)
- Git

### Installation

1. **Clone the repository**
```bash
git clone [repository-url]
cd AeroSuite
```

2. **Install dependencies**
```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install
```

3. **Set up environment variables**
```bash
# Copy the example environment file
cp server/env.example server/.env
# Edit server/.env with your configuration
```

4. **Start the application**
```bash
# Start backend (from server directory)
npm run dev

# Start frontend (from client directory in new terminal)
npm start
```

## 📚 Documentation

- **API Documentation**: [API Docs](docs/api/)
- **User Manual**: [User Guide](docs/user-manual/)
- **Development Guide**: [Developer Docs](docs/development/)
- **Deployment Guide**: [Deployment Docs](docs/deployment/)

## 🔧 Development

### Local Development
```bash
# Frontend development
cd client
npm run dev

# Backend development  
cd server
npm run dev
```

### Testing
```bash
# Run all tests
npm run test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build individual images
docker build -t aerosuite-client ./client
docker build -t aerosuite-server ./server

# Run containers
docker run -p 3000:80 aerosuite-client
docker run -p 5000:5000 aerosuite-server
```

## 📈 Monitoring & Analytics

- Grafana dashboards at `http://localhost:3003`
- Prometheus metrics at `http://localhost:9090`
- Application logs via Loki
- Real-time performance monitoring
- Advanced error tracking and alerting

## 🔐 Security

- OWASP Top 10 compliance
- Automated API security scanning
- Security headers implementation
- Regular security audits
- Continuous vulnerability assessments
- JWT-based authentication with 2FA

## 🚀 Deployment Options

### Development
- Local development server
- Hot reload enabled
- Debug mode active

### Staging
- Docker containers
- Environment-specific configs
- Automated testing

### Production
- Kubernetes deployment
- Load balancing
- High availability
- Monitoring & alerting
- Backup & recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` directory
- **Issues**: Submit via GitHub Issues
- **Enterprise Support**: Contact enterprise support team

---

**Latest Update**: Full enterprise application with advanced features, monitoring, and production-ready deployment capabilities. 