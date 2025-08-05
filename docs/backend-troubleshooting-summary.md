# Backend Server Troubleshooting Summary

## Issues Identified and Resolved

### 1. **Docker Build Issues**
- **Problem**: `npm ci` failed because `package-lock.json` was missing
- **Solution**: Changed `npm ci` to `npm install` in Dockerfile
- **Status**: ✅ Resolved

### 2. **Port Conflict**
- **Problem**: Port 5000 was already in use by macOS ControlCenter
- **Solution**: Changed port mapping to 5001:5000 in docker-compose.yml
- **Status**: ✅ Resolved

### 3. **MongoDB Connection**
- **Problem**: Backend couldn't connect to MongoDB when running locally
- **Solution**: 
  - Started MongoDB in Docker container
  - Created connection retry logic in startup.js
  - Added MongoDB initialization script
- **Status**: ✅ Resolved

### 4. **Missing Dependencies**
- **Problem**: Some npm packages were not installed
- **Solution**: Fixed by running `npm install` with legacy-peer-deps flag
- **Status**: ✅ Resolved

### 5. **Mongoose Schema Warnings**
- **Problem**: Duplicate schema index warnings when running locally
- **Solution**: This is a warning (not error) from duplicate index definitions
- **Status**: ⚠️ Warning only - doesn't affect functionality

## Current Status

### ✅ Working
- Backend server runs successfully in Docker on port 5001
- Health endpoint responds at `http://localhost:5001/api/health`
- MongoDB and Redis are running in Docker containers
- All critical dependencies are installed

### 📝 Configuration
The backend is now configured with:
- **Port**: 5001 (mapped from internal 5000)
- **MongoDB**: mongodb://mongo:27017/aerosuite (Docker network)
- **Redis**: redis://redis:6379 (Docker network)
- **Environment**: Production (in Docker)

## Quick Commands

### Start Backend Services
```bash
# Start all services (MongoDB, Redis, Backend)
docker compose up -d

# Start only database services
docker compose up -d mongo redis

# Start backend server
docker compose up -d aerosuite-server
```

### Check Status
```bash
# View running containers
docker ps

# Check backend health
curl http://localhost:5001/api/health

# View backend logs
docker logs aerosuite-main-aerosuite-server-1 --tail 50

# Follow logs in real-time
docker logs -f aerosuite-main-aerosuite-server-1
```

### Debug Issues
```bash
# Run comprehensive debug script
node scripts/debug-backend.js

# Run backend locally (requires MongoDB/Redis running)
cd server && PORT=5001 npm run dev

# Check what's using a port
lsof -i :5001
```

### Stop Services
```bash
# Stop all services
docker compose down

# Stop backend only
docker compose stop aerosuite-server
```

## Files Created/Modified

1. **scripts/debug-backend.js** - Comprehensive backend debugging tool
2. **scripts/fix-backend-startup.js** - Automated fix application script
3. **server/src/startup.js** - Connection retry wrapper
4. **server/src/healthCheckEnhanced.js** - Enhanced health check utilities
5. **scripts/mongo-init.js** - MongoDB initialization script
6. **server/.env.example** - Environment variable template
7. **server/Dockerfile** - Fixed Docker build configuration
8. **docker-compose.yml** - Updated with correct port mappings

## Next Steps

1. **For E2E Testing**: The backend is now ready at `http://localhost:5001`
   ```bash
   # Update E2E test configuration to use port 5001
   CYPRESS_API_URL=http://localhost:5001 npm run test:e2e:auto
   ```

2. **For Development**: 
   - Use the Docker setup for consistency
   - Or run locally with `cd server && PORT=5001 npm run dev`

3. **For Production**:
   - Update environment variables in `.env` file
   - Consider using Docker Swarm or Kubernetes for orchestration

## Best Practices to Prevent Future Issues

1. **Always check port availability** before starting services
2. **Use Docker** for consistent development environment
3. **Keep package-lock.json** in version control
4. **Monitor logs** during startup for early error detection
5. **Use health checks** to verify service readiness
6. **Document environment variables** required for the application

## Troubleshooting Tips

If you encounter issues:

1. **Check Docker status**: `docker ps -a`
2. **View detailed logs**: `docker logs <container-name>`
3. **Verify network connectivity**: `docker network ls`
4. **Test endpoints directly**: `curl -v http://localhost:5001/api/health`
5. **Run debug script**: `node scripts/debug-backend.js`

The backend server is now successfully running and ready for use!