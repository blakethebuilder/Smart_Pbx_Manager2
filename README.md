# MSP Fleet Dashboard

A streamlined dashboard for monitoring multiple Yeastar P-Series Cloud PBX instances with real-time health status updates.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-success)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![React](https://img.shields.io/badge/React-18-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🆕 New React Edition Available!

This project now includes a modern **React/Next.js frontend** alongside the original vanilla JavaScript version:

- **React Frontend** (`frontend-react/`): Modern TypeScript-based UI with enhanced UX
- **Legacy Frontend** (`frontend/`): Original vanilla JS implementation
- **Shared Backend** (`backend/`): Same Node.js API serves both frontends

## 🚀 Quick Start

### Automatic Setup (Recommended)
```bash
# Clone the repository
git clone https://github.com/yourusername/Smart_Pbx_Manager2.git
cd Smart_Pbx_Manager2

# Start both backend and React frontend
./start-dev.sh
```

### Manual Setup
```bash
# Install dependencies
cd backend && npm install
cd ../frontend-react && npm install

# Start backend (Terminal 1)
cd backend && npm run dev

# Start React frontend (Terminal 2)  
cd frontend-react && npm run dev
```

### Access Points
- **React Dashboard**: http://localhost:3001 ⚛️ (Recommended)
- **Legacy Dashboard**: http://localhost:3000 🌐
- **Backend API**: http://localhost:3000/api 📡

**Default Login**: `Smart@2026!`

## 📊 Features Comparison

| Feature | Legacy Frontend | React Frontend |
|---------|----------------|----------------|
| **Technology** | Vanilla JS + HTML | React + Next.js + TypeScript |
| **Real-time Updates** | ✅ Socket.io | ✅ Socket.io |
| **Responsive Design** | ✅ Tailwind CSS | ✅ Tailwind CSS |
| **Type Safety** | ❌ | ✅ TypeScript |
| **Component Reusability** | ❌ | ✅ React Components |
| **Hot Reload** | ❌ | ✅ Next.js |
| **Development Experience** | Basic | ✅ Enhanced |
| **Production Ready** | ✅ | ✅ |

## 🎯 What It Monitors

For each PBX instance, the dashboard displays:

- **Connection Status**: Is the API reachable? (Green/Red indicator)
- **Trunks**: `3/3 Registered` with alarm if any are down
- **Extensions**: `45/50 Online` count
- **Concurrent Calls**: `2/30 Active` vs license limit
- **Overall Health**: Automatic status determination

## 🐳 Docker Deployment

### Development
```bash
# Start backend + React frontend
docker-compose up backend frontend-react

# Start legacy version
docker-compose --profile legacy up
```

### Production
```bash
# Build and deploy
docker-compose up -d backend frontend-react
```

## 📚 Documentation

- **[QUICK-START.md](QUICK-START.md)**: 2-minute setup guide
- **[README-REACT.md](README-REACT.md)**: Complete React documentation
- **[DOKPLOY-DEPLOYMENT.md](DOKPLOY-DEPLOYMENT.md)**: Production deployment guide

## 🏗️ Project Structure

```
MSP Fleet Dashboard/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Core services (polling, health checks)
│   │   └── server.js       # Express + Socket.io server
│   └── data/               # PBX configuration storage
├── frontend-react/         # React/Next.js frontend (NEW)
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   └── types/         # TypeScript definitions
│   └── package.json
├── frontend/               # Legacy vanilla JS frontend
│   └── public/
├── scripts/                # Setup and deployment scripts
└── docker-compose.yml      # Multi-service Docker setup
```

## 🔧 Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MASTER_PASSWORD` | `Smart@2026!` | Master password for dashboard access |
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Backend server port |
| `SESSION_SECRET` | Auto-generated | Session encryption key |
| `CORS_ORIGIN` | `*` | CORS origin (set to your domain in production) |

### PBX Configuration

PBX instances are stored in `backend/data/pbxs.json`. Add your Yeastar PBX instances through the web interface.

## 🔒 Security Considerations

### Production Deployment

1. **Change the default password**:
   ```bash
   MASTER_PASSWORD=YourVerySecurePassword123!
   ```

2. **Set a strong session secret**:
   ```bash
   SESSION_SECRET=$(openssl rand -base64 32)
   ```

3. **Enable HTTPS**: Use a reverse proxy with SSL/TLS

4. **Restrict CORS**:
   ```bash
   CORS_ORIGIN=https://your-domain.com
   ```

## 🚀 Dokploy Deployment

### Option 1: Separate Services (Recommended)
- Deploy backend and React frontend as separate services
- Better scalability and independent updates

### Option 2: Monolithic
- Single service deployment
- Simpler setup, good for smaller deployments

See **[DOKPLOY-DEPLOYMENT.md](DOKPLOY-DEPLOYMENT.md)** for detailed instructions.

## 🔄 Migration Path

You can migrate gradually:

1. **Keep existing setup** - Legacy frontend continues working
2. **Deploy React frontend** - Run both simultaneously  
3. **Test thoroughly** - Compare both versions
4. **Switch when ready** - Update your main URL

Both frontends use the same backend API, so migration is seamless.

## 🛠️ Development

### Adding Features

1. **Backend changes**: Modify `/backend/src/`
2. **React components**: Add to `/frontend-react/src/components/`
3. **Legacy updates**: Edit `/frontend/public/`

### Code Style

- **Backend**: ES6 modules, Express.js
- **React**: TypeScript, functional components, hooks
- **Styling**: Tailwind CSS (both frontends)

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot GET /" on port 3000**
   - Backend server not running
   - Run: `cd backend && npm run dev`

2. **Socket.io connection failed**
   - Backend must be running first
   - Check firewall settings
   - Verify port 3000 is accessible

3. **React app connection errors**
   - Ensure backend is running on port 3000
   - Check browser console for specific errors

### Debug Commands

```bash
# Check if services are running
curl http://localhost:3000/health
curl http://localhost:3001

# View logs
docker-compose logs backend
docker-compose logs frontend-react
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/enhancement`
3. Make changes (backend and/or frontend)
4. Test with both frontend versions
5. Submit pull request

## 📝 License

MIT License - see LICENSE file for details

## 📞 Support

- **Issues**: GitHub Issues
- **Documentation**: README files in this repository
- **Quick Help**: Check QUICK-START.md

## 🎉 Acknowledgments

- Built for MSP fleet monitoring
- Designed for Yeastar P-Series Cloud PBX
- Optimized for Dokploy deployment
- Modern React edition for enhanced developer experience

---

**Choose Your Frontend:**
- **React** (recommended): Modern, type-safe, component-based
- **Legacy**: Proven, simple, vanilla JavaScript

**Both versions provide the same powerful PBX monitoring capabilities!**
