# Dokploy Deployment Guide - React Edition

This guide covers deploying the MSP Fleet Dashboard with React frontend to Dokploy.

## 🏗️ Architecture Options

### Option 1: Separate Services (Recommended)
- **Backend Service**: API server on port 3000
- **Frontend Service**: React app on port 3001
- **Benefits**: Independent scaling, easier updates

### Option 2: Monolithic (Legacy Compatible)
- **Single Service**: Backend serves both API and static files
- **Benefits**: Simpler deployment, single container

## 🚀 Option 1: Separate Services Deployment

### Step 1: Deploy Backend Service

1. **Create New Service** in Dokploy
   - Service Type: **Docker**
   - Source: **GitHub**

2. **Repository Configuration**
   - Repository: `https://github.com/yourusername/Smart_Pbx_Manager2.git`
   - Branch: `main`
   - Build Path: `/`
   - Dockerfile: `Dockerfile.backend`

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3000
   MASTER_PASSWORD=YourSecurePassword123!
   SESSION_SECRET=your-random-secret-key-here
   CORS_ORIGIN=https://your-frontend-domain.com
   ```

4. **Volume Mounts**
   - Container Path: `/app/data`
   - Host Path: `/var/lib/dokploy/data/msp-backend`

5. **Port Mapping**
   - Container Port: `3000`
   - Host Port: `3000`

6. **Health Check**
   - Endpoint: `/health`
   - Interval: 30 seconds

### Step 2: Deploy Frontend Service

1. **Create New Service** in Dokploy
   - Service Type: **Docker**
   - Source: **GitHub**

2. **Repository Configuration**
   - Repository: `https://github.com/yourusername/Smart_Pbx_Manager2.git`
   - Branch: `main`
   - Build Path: `/`
   - Dockerfile: `Dockerfile.frontend`

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3001
   NEXT_PUBLIC_API_URL=https://your-backend-domain.com
   ```

4. **Port Mapping**
   - Container Port: `3001`
   - Host Port: `3001`

### Step 3: Configure Domains

1. **Backend Domain**: `api.your-domain.com` → Port 3000
2. **Frontend Domain**: `dashboard.your-domain.com` → Port 3001

### Step 4: Update CORS

Update backend environment:
```
CORS_ORIGIN=https://dashboard.your-domain.com
```

## 🚀 Option 2: Monolithic Deployment

### Single Service Setup

1. **Create New Service** in Dokploy
   - Service Type: **Docker**
   - Source: **GitHub**

2. **Repository Configuration**
   - Repository: `https://github.com/yourusername/Smart_Pbx_Manager2.git`
   - Branch: `main`
   - Build Path: `/`
   - Dockerfile: `Dockerfile` (original)

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=3000
   MASTER_PASSWORD=YourSecurePassword123!
   SESSION_SECRET=your-random-secret-key-here
   CORS_ORIGIN=*
   ```

4. **Volume Mounts**
   - Container Path: `/app/data`
   - Host Path: `/var/lib/dokploy/data/msp-dashboard`

5. **Port Mapping**
   - Container Port: `3000`
   - Host Port: `3000`

## 🔧 Custom Dockerfile for Dokploy

If you want to deploy React as the primary frontend, create this Dockerfile:

```dockerfile
# Multi-stage build for React + Backend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY frontend-react/package*.json ./
RUN npm ci
COPY frontend-react/ ./
RUN npm run build

FROM node:20-alpine AS backend

WORKDIR /app

# Copy backend
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/src ./src

# Copy built React app
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public

# Create data directory
RUN mkdir -p data

EXPOSE 3000

CMD ["npm", "start"]
```

## 🌐 Reverse Proxy Configuration

### Nginx Configuration (if using custom proxy)

```nginx
# Backend API
location /api/ {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}

# Socket.io
location /socket.io/ {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# React Frontend
location / {
    proxy_pass http://frontend:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 🔒 Security Configuration

### Environment Variables

```bash
# Generate secure session secret
SESSION_SECRET=$(openssl rand -base64 32)

# Strong password
MASTER_PASSWORD=YourVerySecurePassword123!

# Restrict CORS in production
CORS_ORIGIN=https://your-domain.com
```

### SSL/TLS

Dokploy handles SSL automatically, but ensure:
1. Domain is properly configured
2. SSL certificate is valid
3. Force HTTPS redirects are enabled

## 📊 Monitoring & Health Checks

### Backend Health Check
- **Endpoint**: `GET /health`
- **Expected Response**: `{"status":"ok","timestamp":"..."}`
- **Interval**: 30 seconds

### Frontend Health Check
- **Endpoint**: `GET /` (React app)
- **Expected**: HTTP 200 with HTML content
- **Interval**: 60 seconds

### Logs Monitoring

```bash
# View backend logs
docker logs msp-backend -f

# View frontend logs
docker logs msp-frontend-react -f

# View all services
docker-compose logs -f
```

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] Repository is accessible to Dokploy
- [ ] Environment variables are configured
- [ ] Domains are set up
- [ ] SSL certificates are ready

### Backend Deployment
- [ ] Service created and deployed
- [ ] Health check passes
- [ ] API endpoints respond correctly
- [ ] Socket.io connection works
- [ ] Data volume is mounted

### Frontend Deployment
- [ ] Service created and deployed
- [ ] React app loads correctly
- [ ] API calls work (check browser network tab)
- [ ] Real-time updates function
- [ ] Authentication flow works

### Post-Deployment
- [ ] Test login with master password
- [ ] Add a test PBX instance
- [ ] Verify real-time updates
- [ ] Check mobile responsiveness
- [ ] Monitor logs for errors

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot connect to backend"**
   ```bash
   # Check backend service status
   docker ps | grep backend
   
   # Check backend logs
   docker logs msp-backend
   
   # Verify environment variables
   docker exec msp-backend env | grep API
   ```

2. **"CORS errors"**
   - Update `CORS_ORIGIN` in backend environment
   - Restart backend service
   - Clear browser cache

3. **"Socket.io connection failed"**
   - Ensure WebSocket support in proxy
   - Check firewall settings
   - Verify Socket.io endpoint accessibility

4. **"React app won't load"**
   ```bash
   # Check frontend service
   docker ps | grep frontend
   
   # Check build logs
   docker logs msp-frontend-react
   
   # Verify API URL configuration
   docker exec msp-frontend-react env | grep API
   ```

### Debug Commands

```bash
# Test backend API
curl https://your-backend-domain.com/health

# Test frontend
curl https://your-frontend-domain.com

# Check service connectivity
docker exec msp-frontend-react ping backend

# View real-time logs
docker-compose logs -f backend frontend-react
```

## 📈 Performance Optimization

### Backend Optimization
- Enable gzip compression
- Set appropriate cache headers
- Monitor memory usage
- Use PM2 for process management (optional)

### Frontend Optimization
- Next.js automatic optimizations
- Image optimization
- Code splitting
- Static asset caching

### Database Optimization
- Regular cleanup of old data
- Monitor file size growth
- Backup data directory regularly

## 🔄 Updates & Maintenance

### Updating Services

1. **Backend Updates**:
   - Push changes to repository
   - Dokploy auto-deploys on git push
   - Monitor health checks

2. **Frontend Updates**:
   - Push React changes to repository
   - Dokploy rebuilds and deploys
   - Clear CDN cache if applicable

### Backup Strategy

```bash
# Backup PBX data
docker cp msp-backend:/app/data ./backup-$(date +%Y%m%d)

# Restore data
docker cp ./backup-20241228 msp-backend:/app/data
```

## 📞 Support

- **Logs**: Check Dokploy service logs
- **Health**: Monitor health check endpoints
- **Performance**: Use Dokploy metrics dashboard
- **Issues**: GitHub repository issues

---

**🎉 Your React-powered MSP Fleet Dashboard is now running on Dokploy!**

Access your dashboard at your configured domain and start monitoring your PBX fleet with the modern React interface.