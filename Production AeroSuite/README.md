# Production AeroSuite

A streamlined production version of the AeroSuite dashboard application.

## Features

- ✅ Interactive Dashboard (`dashboard.html`)
- ✅ REST API with mock data
- ✅ CORS enabled for cross-origin requests
- ✅ Express.js server with static file serving

## Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Start the application
npm start

# Or start in production mode on port 5001
npm run start:production
```

### Accessing the Application

Once started, the application will be available at:

- **Main Dashboard**: http://localhost:5001
- **Demo Page**: http://localhost:5001/demo
- **Apple Design Demo**: http://localhost:5001/apple-design
- **Enhanced Dashboard**: http://localhost:5001/enhanced-dashboard
- **Organization Chart**: http://localhost:5001/org-chart
- **Health Check**: http://localhost:5001/api/health

## API Endpoints

### Core Endpoints
- `GET /api/health` - Server health check
- `GET /api/suppliers` - List all suppliers
- `GET /api/customers` - List all customers
- `GET /api/inspections` - List all inspections
- `GET /api/tasks` - List all tasks
- `GET /api/relationships` - List all relationships

### Authentication
- `POST /api/auth/login` - Mock login endpoint

### Task Management (Kanban)
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Resource Details
- `GET /api/suppliers/:id` - Get supplier by ID
- `GET /api/customers/:id` - Get customer by ID
- `GET /api/inspections/:id` - Get inspection by ID
- `GET /api/customers/:customerId/suppliers` - Get suppliers for customer

## File Structure

```
Production AeroSuite/
├── simple-server.js           # Express server
├── package.json              # Dependencies
├── README.md                 # This file
├── dashboard.html            # Main dashboard
└── [other HTML files]       # Additional pages
```

## Environment Variables

- `PORT` - Server port (default: 5001)
- `NODE_ENV` - Environment mode (development/production)

## Development Notes

This is a standalone production application extracted from the main AeroSuite codebase. It includes:

- All necessary HTML files and assets
- Mock data for development and testing
- Simple Express.js server
- No build process required - ready to run

## Support

For issues or questions about the Production AeroSuite application, please refer to the main AeroSuite documentation or contact the development team. 