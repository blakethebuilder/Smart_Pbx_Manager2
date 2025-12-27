# Quick Start Guide - MSP Fleet Dashboard React Edition

## 🚀 Getting Started in 2 Minutes

### Prerequisites
- Node.js 18+ installed
- Git installed

### Option 1: Automatic Setup (Recommended)
```bash
# Clone and setup everything
git clone <your-repo-url>
cd Smart_Pbx_Manager2

# Run the automated setup
./start-dev.sh
```

### Option 2: Manual Setup
```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Install React frontend dependencies  
cd ../frontend-react
npm install

# 3. Start backend (Terminal 1)
cd ../backend
npm run dev

# 4. Start React frontend (Terminal 2)
cd ../frontend-react
npm run dev
```

## 📱 Access Your Dashboard

- **React Dashboard**: http://localhost:3001 ⚛️ (New!)
- **Legacy Dashboard**: http://localhost:3000 🌐 (Original)
- **Backend API**: http://localhost:3000/api 📡

## 🔐 Login

Default credentials:
- **Password**: `Smart@2026!`

## ⚡ Quick Test

1. Open http://localhost:3001
2. Login with the default password
3. Click "Add PBX" to add your first Yeastar instance
4. Watch real-time updates every 60 seconds

## 🐛 Troubleshooting

### "Cannot GET /" on port 3000
- The backend server isn't running
- Run: `cd backend && npm run dev`

### Socket.io connection errors on React app
- Make sure backend is running on port 3000 first
- React app connects to backend for real-time updates

### "Module not found" errors
- Run: `npm install` in the respective directory
- Backend: `cd backend && npm install`
- Frontend: `cd frontend-react && npm install`

## 🔄 Development Workflow

1. **Backend changes**: Edit files in `backend/src/`
2. **React changes**: Edit files in `frontend-react/src/`
3. **Both auto-reload**: Changes are reflected immediately

## 🎯 What's Different in React Version?

- **TypeScript**: Full type safety
- **Components**: Reusable React components
- **Better UX**: Enhanced animations and interactions
- **Modern Stack**: Next.js, React 18, TypeScript 5
- **Same Backend**: Uses your existing Node.js API

## 📦 Production Deployment

See `DOKPLOY-DEPLOYMENT.md` for complete deployment instructions.

---

**🎉 You're ready to monitor your PBX fleet with React!**