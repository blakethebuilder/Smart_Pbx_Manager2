# MSP Fleet Dashboard

A streamlined dashboard for monitoring multiple Yeastar P-Series Cloud PBX instances with real-time health status updates.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-success)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- 🎯 **Fleet View**: Monitor all your PBX instances at a glance
- 📊 **Real-Time Updates**: Automatic refresh every 60 seconds via Socket.io
- 🟢 **Health Indicators**: Green/Yellow/Red status for each PBX
- 🔐 **Password Protected**: Secure access with master password
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🐳 **Docker Ready**: Optimized for Dokploy deployment
- 💾 **Simple Storage**: JSON file-based configuration (no database needed)

## What It Monitors

For each PBX instance, the dashboard displays:

- **Connection Status**: Is the API reachable? (Green/Red indicator)
- **Trunks**: `3/3 Registered` with alarm if any are down
- **Extensions**: `45/50 Online` count
- **Concurrent Calls**: `2/30 Active` vs license limit
- **Overall Health**: Automatic status determination

## Quick Start

### Prerequisites

- Node.js 20 or higher
- Yeastar P-Series Cloud PBX with API enabled

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/blakethebuilder/Smart_Pbx_Manager2.git
   cd Smart_Pbx_Manager2
   ```

2. **Install dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Configure environment** (optional):
   ```bash
   cp .env.example .env
   # Edit .env to set custom password
   ```

4. **Start the server**:
   ```bash
   npm start
   ```

5. **Open dashboard**:
   - Navigate to `http://localhost:3000`
   - Login with password: `Smart@2026!` (or your custom password)
   - Add your first PBX instance

## Docker Deployment

### Using Docker Compose (Recommended)

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Using Docker CLI

```bash
# Build image
docker build -t msp-fleet-dashboard .

# Run container
docker run -d \
  -p 3000:3000 \
  -e MASTER_PASSWORD=Smart@2026! \
  -v $(pwd)/data:/app/data \
  --name fleet-dashboard \
  msp-fleet-dashboard
```

## Dokploy Deployment

### Step 1: Create New Service

1. Log into your Dokploy dashboard
2. Click **"Create Service"**
3. Select **"Docker"** as the service type
4. Choose **"GitHub"** as the source

### Step 2: Configure Repository

- **Repository**: `https://github.com/blakethebuilder/Smart_Pbx_Manager2.git`
- **Branch**: `main`
- **Build Path**: `/`
- **Dockerfile**: `Dockerfile`

### Step 3: Environment Variables

Add the following environment variables in Dokploy:

```
MASTER_PASSWORD=YourSecurePassword123!
NODE_ENV=production
PORT=3000
SESSION_SECRET=your-random-secret-key-here
```

### Step 4: Volume Mounts

Mount the data directory to persist PBX configurations:

- **Container Path**: `/app/data`
- **Host Path**: `/var/lib/dokploy/data/fleet-dashboard`

### Step 5: Port Mapping

- **Container Port**: `3000`
- **Host Port**: `3000` (or your preferred port)

### Step 6: Health Check

Dokploy will automatically use the built-in health check:
- **Endpoint**: `/health`
- **Interval**: 30 seconds

### Step 7: Deploy

Click **"Deploy"** and wait for the build to complete.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MASTER_PASSWORD` | `Smart@2026!` | Master password for dashboard access |
| `NODE_ENV` | `development` | Environment mode (`development` or `production`) |
| `PORT` | `3000` | Server port |
| `SESSION_SECRET` | Auto-generated | Secret key for session encryption |
| `CORS_ORIGIN` | `*` | CORS origin (set to your domain in production) |

### PBX Configuration

PBX instances are stored in `backend/data/pbxs.json`:

```json
{
  "pbxs": [
    {
      "id": "uuid",
      "name": "Main Office",
      "url": "https://main.pbx.example.com",
      "appId": "your-client-id",
      "appSecret": "your-client-secret",
      "createdAt": "2025-12-25T08:00:00.000Z"
    }
  ]
}
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login with master password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/check` - Check authentication status

### PBX Management

All endpoints require authentication:

- `GET /api/pbx` - List all PBX instances
- `POST /api/pbx` - Add new PBX instance
- `PUT /api/pbx/:id` - Update PBX instance
- `DELETE /api/pbx/:id` - Delete PBX instance

### Health Check

- `GET /health` - Server health status

## How It Works

### Safety-First Token Caching

The dashboard implements strict token caching to prevent IP blocking:

- Tokens are cached in memory for 30 minutes
- **Minimum 60 seconds** between token requests per PBX
- Automatic token refresh before expiry
- Rate limiting prevents excessive API calls

### Background Polling

- Polls all PBX instances every **60 seconds**
- Fetches trunk status, extension stats, and concurrent calls
- Determines health status automatically
- Broadcasts updates to all connected clients via Socket.io

### Real-Time Updates

- Socket.io connection for instant updates
- No page refresh needed
- Automatic reconnection on disconnect
- Updates timestamp on each refresh

## Health Status Logic

| Status | Color | Condition |
|--------|-------|-----------|
| 🟢 Healthy | Green | All trunks online, normal call usage |
| 🟡 Warning | Yellow | Some trunks offline, or high call usage (>80%) |
| 🔴 Critical | Red | All trunks offline |
| ⚫ Error | Gray | API unreachable or authentication failed |

## Security Considerations

### Production Deployment

1. **Change the default password**:
   ```bash
   MASTER_PASSWORD=YourVerySecurePassword123!
   ```

2. **Set a strong session secret**:
   ```bash
   SESSION_SECRET=$(openssl rand -base64 32)
   ```

3. **Enable HTTPS**: Use a reverse proxy (nginx, Caddy) with SSL/TLS

4. **Restrict CORS**:
   ```bash
   CORS_ORIGIN=https://your-domain.com
   ```

5. **Firewall**: Only allow access from trusted IPs

### PBX API Security

- Enable API access in PBX settings: **Integrations > API**
- Add your server IP to the PBX allowlist
- Use strong Client ID and Client Secret
- Rotate credentials periodically

## Troubleshooting

### "Invalid password" on login

- Check `MASTER_PASSWORD` environment variable
- Default password is `Smart@2026!`

### PBX shows "Error" status

- Verify PBX URL is correct and accessible
- Check API is enabled on the PBX
- Verify Client ID and Client Secret are correct
- Ensure server IP is in PBX allowlist

### Dashboard not updating

- Check browser console for Socket.io connection errors
- Verify server is running: `docker logs fleet-dashboard`
- Check background poller is active in server logs

### "Rate limit" errors

- The system enforces 60-second minimum between token requests
- This is normal and prevents IP blocking
- Wait for the next polling cycle

## Development

### Project Structure

```
SmartPBXManager/
├── backend/
│   ├── src/
│   │   ├── middleware/      # Authentication middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Core services (poller, health checker, etc.)
│   │   └── server.js        # Express + Socket.io server
│   ├── data/
│   │   └── pbxs.json        # PBX configuration
│   └── package.json
├── frontend/
│   └── public/
│       ├── index.html       # Login page
│       ├── dashboard.html   # Fleet dashboard
│       ├── fleet.js         # Dashboard logic
│       └── fleet.css        # Styling
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### Running Tests

```bash
# Start server
npm start

# Test authentication
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"Smart@2026!"}'

# Test health endpoint
curl http://localhost:3000/health
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Open an issue on GitHub
- Check the troubleshooting section above

## Acknowledgments

- Built for MSP fleet monitoring
- Designed for Yeastar P-Series Cloud PBX
- Optimized for Dokploy deployment

---

**Made with ❤️ for MSPs managing multiple PBX instances**
