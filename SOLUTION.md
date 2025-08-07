# AeroSuite Solution Documentation

## Problem

The AeroSuite application was experiencing several connectivity issues:

1. The frontend on port 3000 was showing "API Server is not responding"
2. API endpoints on port 5002 were returning errors
3. The backend server on port 5001 was not properly connected to the frontend

## Root Cause Analysis

After investigation, we discovered the following issues:

1. **Port Mismatch**: The frontend was configured to connect to an API on port 5002, but our main backend server was running on port 5001.

2. **Missing Service**: The application depends on a simple server running on port 5002, which provides some API endpoints, but this server was not automatically started.

3. **Docker Configuration**: The Docker setup was correctly configured for the main backend server on port 5001, but there was no integration with the simple server on port 5002.

## Solution

We implemented the following fixes:

1. **Started the Simple Server**: We manually started the simple server on port 5002, which provides several API endpoints needed by the frontend.

2. **Created Startup Script**: We created a `start-aerosuite.sh` script that:
   - Starts all Docker containers (MongoDB, Redis, main backend server, frontend)
   - Waits for the containers to be healthy
   - Starts the simple server on port 5002
   - Opens the application in the default browser

3. **Created Shutdown Script**: We created a `stop-aerosuite.sh` script that:
   - Stops the simple server process
   - Stops all Docker containers

## How to Use

### Starting the Application

To start the AeroSuite application:

```bash
./start-aerosuite.sh
```

This will:
- Start all Docker containers
- Start the simple server on port 5002
- Open the application in your default browser

### Stopping the Application

To stop the AeroSuite application:

```bash
./stop-aerosuite.sh
```

This will:
- Stop the simple server process
- Stop all Docker containers

## Available Endpoints

### Main Backend (Port 5001)

- Health Check: http://localhost:5001/api/health

### Simple Server (Port 5002)

- Health Check: http://localhost:5002/api/health
- Suppliers: http://localhost:5002/api/suppliers
- Customers: http://localhost:5002/api/customers
- Inspections: http://localhost:5002/api/inspections
- Authentication: http://localhost:5002/api/auth/login

### Frontend (Port 3000)

- Main Application: http://localhost:3000

## Next Steps

1. **Integrate Simple Server into Docker**: Consider moving the simple server into a Docker container to make the deployment more consistent.

2. **Update Frontend Configuration**: Update the frontend code to use environment variables for API endpoints to make it more configurable.

3. **Implement Proper Service Discovery**: Implement a proper service discovery mechanism to avoid hardcoding ports and hostnames.

4. **Add Health Checks**: Add more comprehensive health checks to ensure all services are running correctly.

5. **Improve Error Handling**: Improve error handling in the frontend to provide more helpful error messages when services are unavailable.

## Troubleshooting

If you encounter issues:

1. **Check Logs**: Check the logs for each service:
   - Docker containers: `docker logs <container-name>`
   - Simple server: `cat logs/simple-server.log`

2. **Check Ports**: Ensure no other services are using the required ports:
   - 3000: Frontend
   - 5001: Main backend
   - 5002: Simple server
   - 27017: MongoDB
   - 6379: Redis

3. **Restart Services**: Try restarting all services:
   ```bash
   ./stop-aerosuite.sh
   ./start-aerosuite.sh
   ```
