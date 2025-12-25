# Dokploy Deployment Guide

This guide provides step-by-step instructions for deploying the MSP Fleet Dashboard to Dokploy.

## Prerequisites

- Dokploy instance running and accessible
- GitHub repository: `https://github.com/blakethebuilder/Smart_Pbx_Manager2.git`
- Domain name (optional, but recommended for production)

## Deployment Steps

### 1. Create New Application

1. Log into your Dokploy dashboard
2. Navigate to your project or create a new one
3. Click **"Add Service"** or **"New Application"**
4. Select **"Docker"** as the deployment type

### 2. Configure Source

**Repository Settings**:
- **Source Type**: GitHub
- **Repository URL**: `https://github.com/blakethebuilder/Smart_Pbx_Manager2.git`
- **Branch**: `main`
- **Auto Deploy**: ✅ Enable (optional - deploys on git push)

**Build Settings**:
- **Build Path**: `/`
- **Dockerfile Path**: `Dockerfile`
- **Build Context**: `.`

### 3. Environment Variables

Click **"Environment"** and add the following variables:

#### Required Variables

```bash
MASTER_PASSWORD=YourSecurePassword123!
NODE_ENV=production
PORT=3000
```

#### Recommended Variables

```bash
# Generate with: openssl rand -base64 32
SESSION_SECRET=your-random-secret-key-here

# Set to your domain in production
CORS_ORIGIN=https://your-domain.com
```

### 4. Volume Mounts

Configure persistent storage for PBX configurations:

**Mount Configuration**:
- **Container Path**: `/app/data`
- **Volume Name**: `fleet-dashboard-data` (Dokploy will create this)
- **Type**: Named Volume

This ensures your PBX configurations persist across container restarts.

### 5. Port Configuration

**Port Mapping**:
- **Container Port**: `3000`
- **Protocol**: HTTP
- **Public**: ✅ Enable

### 6. Domain Configuration (Optional)

If you have a domain:

1. Go to **"Domains"** section
2. Add your domain: `fleet.yourdomain.com`
3. Enable **SSL/TLS** (Let's Encrypt)
4. Dokploy will automatically configure the reverse proxy

### 7. Health Check

Dokploy will use the built-in Docker health check:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', ...)"
```

No additional configuration needed!

### 8. Deploy

1. Review all settings
2. Click **"Deploy"** or **"Create & Deploy"**
3. Monitor the build logs
4. Wait for deployment to complete (usually 2-3 minutes)

## Post-Deployment

### 1. Access Your Dashboard

- **With Domain**: `https://fleet.yourdomain.com`
- **Without Domain**: `http://your-dokploy-ip:3000`

### 2. Initial Login

1. Navigate to your dashboard URL
2. Enter password: The one you set in `MASTER_PASSWORD`
3. Click "Login"

### 3. Add Your First PBX

1. Click **"+ Add PBX"**
2. Fill in the details:
   - **PBX Name**: e.g., "Main Office"
   - **PBX URL**: `https://your-pbx.yeastar.com`
   - **App ID**: Your Yeastar API Client ID
   - **App Secret**: Your Yeastar API Client Secret
3. Click **"Save PBX"**
4. Wait 60 seconds for the first health check

## Troubleshooting

### Build Fails

**Check build logs** in Dokploy:
- Look for npm install errors
- Verify Dockerfile syntax
- Ensure all dependencies are in package.json

### Container Won't Start

**Check container logs**:
```bash
# In Dokploy, go to "Logs" tab
# Or SSH into server and run:
docker logs <container-name>
```

Common issues:
- Missing environment variables
- Port already in use
- Volume mount permissions

### Can't Access Dashboard

1. **Check port mapping**: Ensure port 3000 is exposed
2. **Check firewall**: Open port 3000 in server firewall
3. **Check domain**: Verify DNS is pointing to Dokploy server
4. **Check SSL**: If using HTTPS, ensure certificate is valid

### PBX Shows "Error" Status

1. **Verify PBX URL**: Must be accessible from Dokploy server
2. **Check API credentials**: Ensure Client ID and Secret are correct
3. **IP Allowlist**: Add Dokploy server IP to PBX allowlist
4. **Enable API**: Verify API is enabled in PBX settings

## Updating the Application

### Automatic Updates (if enabled)

1. Push changes to GitHub
2. Dokploy automatically rebuilds and redeploys
3. Monitor deployment in Dokploy dashboard

### Manual Updates

1. Go to your application in Dokploy
2. Click **"Redeploy"** or **"Rebuild"**
3. Wait for deployment to complete

## Backup and Restore

### Backup PBX Configuration

```bash
# SSH into Dokploy server
docker cp <container-name>:/app/data/pbxs.json ./pbxs-backup.json
```

### Restore PBX Configuration

```bash
# SSH into Dokploy server
docker cp ./pbxs-backup.json <container-name>:/app/data/pbxs.json
docker restart <container-name>
```

## Scaling Considerations

### Single Instance

The current setup runs a single container. For high availability:

1. **Use Dokploy's built-in restart policies**
2. **Enable health checks** (already configured)
3. **Monitor with Dokploy's monitoring tools**

### Multiple Instances

For load balancing across multiple containers:

1. Use Dokploy's scaling features
2. Configure shared volume for `pbxs.json`
3. Use Redis for session storage (requires code changes)

## Security Best Practices

### 1. Strong Passwords

```bash
# Generate secure password
openssl rand -base64 32
```

### 2. HTTPS Only

- Always use SSL/TLS in production
- Dokploy provides free Let's Encrypt certificates
- Enable **"Force HTTPS"** in domain settings

### 3. Restrict Access

- Use firewall rules to limit access
- Consider VPN for internal-only access
- Use Dokploy's built-in authentication

### 4. Regular Updates

- Keep Node.js dependencies updated
- Monitor for security vulnerabilities
- Update base Docker image regularly

## Monitoring

### Dokploy Built-in Monitoring

- **CPU Usage**: Monitor in Dokploy dashboard
- **Memory Usage**: Check container stats
- **Logs**: Real-time log viewing
- **Health Status**: Automatic health checks

### Application Logs

View logs in Dokploy:
1. Go to your application
2. Click **"Logs"** tab
3. Filter by time range or search

## Support

For deployment issues:
- Check Dokploy documentation
- Review application logs
- Open GitHub issue for application bugs

---

**Deployment Time**: ~5 minutes  
**Difficulty**: Easy  
**Maintenance**: Low
