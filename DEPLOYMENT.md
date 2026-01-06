# 🚀 Deployment Guide - Dockploy VPS

This guide covers deploying the MSP PBX Dashboard to a Dockploy VPS with SQLite database.

## 📋 Prerequisites

- Dockploy VPS with Docker support
- Domain name (optional but recommended)
- SSL certificate (Let's Encrypt recommended)

## 🗄️ Database Migration

The application will automatically migrate from the existing `pbx-data.json` file to SQLite on first startup.

### Manual Migration (if needed)
```bash
npm run migrate:database
```

## 🐳 Docker Deployment

### Option 1: Docker Compose (Recommended)

1. **Clone/Upload your project** to the VPS
2. **Configure environment** - Update `.env` file:
   ```env
   NODE_ENV=production
   PORT=8547
   MASTER_PASSWORD=your-secure-password-here
   ```

3. **Deploy with Docker Compose**:
   ```bash
   docker-compose up -d
   ```

### Option 2: Direct Docker Build

1. **Build the image**:
   ```bash
   docker build -t pbx-dashboard .
   ```

2. **Run with volume mounts**:
   ```bash
   docker run -d \
     --name pbx-dashboard \
     -p 8547:8547 \
     -v pbx_data:/app/data \
     -v pbx_logs:/app/logs \
     -e NODE_ENV=production \
     --restart unless-stopped \
     pbx-dashboard
   ```

## 🔧 Dockploy Configuration

### 1. Create New Application
- **Type**: Docker Compose or Dockerfile
- **Repository**: Your Git repository
- **Branch**: main/master

### 2. Environment Variables
Set these in Dockploy:
```
NODE_ENV=production
PORT=8547
MASTER_PASSWORD=your-secure-password
ENCRYPTION_KEY=your-32-byte-encryption-key
JWT_SECRET=your-jwt-secret-minimum-32-chars
```

### 3. Volume Configuration
Ensure these volumes are persistent:
- `/app/data` - SQLite database storage
- `/app/logs` - Application logs

### 4. Port Configuration
- **Container Port**: 8547
- **Host Port**: 8547 (or your preferred port)

### 5. Health Check
Dockploy will use the built-in health check:
```
http://localhost:8547/health
```

## 🌐 Reverse Proxy Setup

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8547;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Traefik Labels (if using Traefik)
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.pbx-dashboard.rule=Host(\`your-domain.com\`)"
  - "traefik.http.routers.pbx-dashboard.tls.certresolver=letsencrypt"
  - "traefik.http.services.pbx-dashboard.loadbalancer.server.port=8547"
```

## 💾 Database Backup

### Automatic Backup Script
Create a backup script for your SQLite database:

```bash
#!/bin/bash
# backup-database.sh

BACKUP_DIR="/backups/pbx-dashboard"
DATE=$(date +%Y%m%d_%H%M%S)
CONTAINER_NAME="pbx-dashboard"

mkdir -p $BACKUP_DIR

# Copy database from container
docker cp $CONTAINER_NAME:/app/data/pbx-dashboard.db $BACKUP_DIR/pbx-dashboard_$DATE.db

# Keep only last 30 backups
find $BACKUP_DIR -name "pbx-dashboard_*.db" -type f -mtime +30 -delete

echo "Backup completed: pbx-dashboard_$DATE.db"
```

### Cron Job for Daily Backups
```bash
# Add to crontab
0 3 * * * /path/to/backup-database.sh
```

## 🔒 Security Considerations

1. **Change Default Password**: Update `MASTER_PASSWORD` in production
2. **Use Strong Encryption Keys**: Generate secure keys for `ENCRYPTION_KEY` and `JWT_SECRET`
3. **Enable HTTPS**: Use SSL certificates (Let's Encrypt)
4. **Firewall Rules**: Only expose necessary ports
5. **Regular Updates**: Keep Docker images updated

## 📊 Monitoring

### Health Check Endpoint
```
GET /health
```

### Log Monitoring
```bash
# View application logs
docker logs -f pbx-dashboard

# View logs from volume
docker exec pbx-dashboard tail -f /app/logs/combined.log
```

### Database Size Monitoring
```bash
# Check database size
docker exec pbx-dashboard ls -lh /app/data/pbx-dashboard.db
```

## 🚨 Troubleshooting

### Common Issues

1. **Database Permission Issues**:
   ```bash
   docker exec pbx-dashboard chown -R node:node /app/data
   ```

2. **Port Already in Use**:
   ```bash
   # Check what's using the port
   netstat -tulpn | grep 8547
   ```

3. **Volume Mount Issues**:
   ```bash
   # Verify volumes
   docker volume ls
   docker volume inspect pbx_data
   ```

### Migration Issues
If migration from JSON fails:
```bash
# Manual migration
docker exec -it pbx-dashboard npm run migrate:database
```

## 📈 Performance Optimization

1. **Database Optimization**: SQLite with WAL mode (enabled by default)
2. **Memory Usage**: Monitor with `docker stats`
3. **Log Rotation**: Logs are automatically rotated by Winston
4. **Rate Limiting**: Built-in API rate limiting to prevent abuse

## 🔄 Updates

### Rolling Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Zero-Downtime Updates (with load balancer)
1. Deploy to staging environment
2. Test thoroughly
3. Switch traffic to new version
4. Keep old version as rollback option

## 📞 Support

- **Application Logs**: `/app/logs/`
- **Database Location**: `/app/data/pbx-dashboard.db`
- **Health Check**: `http://your-domain:8547/health`
- **API Status**: `http://your-domain:8547/test`

---

## 🎯 Quick Start Checklist

- [ ] Update `.env` with production values
- [ ] Configure Dockploy application
- [ ] Set up volume mounts for data persistence
- [ ] Configure reverse proxy/SSL
- [ ] Set up database backups
- [ ] Test health checks
- [ ] Monitor logs and performance
- [ ] Document access credentials securely