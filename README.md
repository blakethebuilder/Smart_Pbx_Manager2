# MSP PBX Dashboard - Simple Version

A dead simple dashboard for monitoring Yeastar PBX instances. No authentication, no complexity, just works.

## Features

- 🎯 **Simple**: No login required, just works
- 📊 **Real-time**: Socket.io updates every 2 minutes
- 🔌 **Easy Setup**: Add PBX instances with API credentials
- 🌐 **Web Interface**: Clean, modern dashboard
- 🐳 **Docker Ready**: Single container deployment

## Quick Start

### Local Development

```bash
npm install
npm start
```

Open http://localhost:3000

### Docker

```bash
docker build -t msp-pbx-dashboard .
docker run -p 3000:3000 msp-pbx-dashboard
```

### Dokploy Deployment

1. Create new service
2. Repository: Your GitHub repo
3. Dockerfile: `Dockerfile`
4. Port: 3000
5. Deploy

## Usage

1. Open the dashboard
2. Click "Add PBX Instance"
3. Enter your Yeastar PBX details:
   - Name (e.g., "Main Office")
   - URL (https://your-pbx.yeastar.com)
   - App ID (from PBX API settings)
   - App Secret (from PBX API settings)
4. Save and monitor!

## API Endpoints

- `GET /` - Dashboard
- `GET /api/pbx` - List PBX instances
- `POST /api/pbx` - Add PBX instance
- `DELETE /api/pbx/:id` - Delete PBX instance
- `GET /health` - Health check

## Data Storage

PBX configurations are stored in `pbx-data.json` file.

---

**Simple. Clean. Works.**