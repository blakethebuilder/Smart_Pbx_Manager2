# MSP Fleet Dashboard - React Edition

A modern React/Next.js frontend for the MSP Fleet Dashboard, providing real-time monitoring of multiple Yeastar P-Series Cloud PBX instances.

![Dashboard Preview](https://img.shields.io/badge/Status-Production%20Ready-success)
![React](https://img.shields.io/badge/React-18-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Node.js](https://img.shields.io/badge/Node.js-20-green)

## 🆕 What's New in React Edition

- **Modern React/Next.js Frontend**: Built with TypeScript for better development experience
- **Component-Based Architecture**: Reusable, maintainable components
- **Enhanced UI/UX**: Improved animations, better responsive design
- **Type Safety**: Full TypeScript support for better code quality
- **Hot Reload**: Instant development feedback
- **Optimized Performance**: Next.js optimizations and code splitting
- **Better State Management**: React hooks for cleaner state handling

## 🏗️ Architecture

```
MSP Fleet Dashboard/
├── backend/                 # Node.js API server (unchanged)
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # Core services
│   │   └── server.js       # Express + Socket.io server
│   └── data/               # PBX configuration storage
├── frontend-react/         # New React/Next.js frontend
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   ├── types/         # TypeScript definitions
│   │   └── lib/           # Utilities
│   └── package.json
└── frontend/               # Legacy vanilla JS frontend
    └── public/
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Development Setup

1. **Run the setup script**:
   ```bash
   ./scripts/dev-setup.sh
   ```

2. **Start the backend** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```

3. **Start the React frontend** (Terminal 2):
   ```bash
   cd frontend-react
   npm run dev
   ```

4. **Access the applications**:
   - **React Dashboard**: http://localhost:3001
   - **Legacy Dashboard**: http://localhost:3000
   - **API**: http://localhost:3000/api

### Manual Setup

If you prefer manual setup:

```bash
# Install backend dependencies
cd backend
npm install

# Install React frontend dependencies
cd ../frontend-react
npm install

# Start backend
cd ../backend
npm run dev

# In another terminal, start React frontend
cd frontend-react
npm run dev
```

## 🐳 Docker Deployment

### Development with Docker

```bash
# Start backend and React frontend
docker-compose up backend frontend-react

# Or start all services including legacy
docker-compose --profile legacy up
```

### Production Deployment

```bash
# Build and start production services
docker-compose up -d backend frontend-react
```

### Dokploy Deployment

For Dokploy deployment, you can choose between:

1. **React Frontend** (recommended):
   - Repository: Your GitHub repo
   - Build Path: `/frontend-react`
   - Port: `3001`
   - Environment: `NODE_ENV=production`

2. **Backend API**:
   - Repository: Your GitHub repo  
   - Build Path: `/backend`
   - Port: `3000`
   - Environment variables as per original README

## 🔧 Configuration

### Environment Variables

**Backend** (same as original):
- `MASTER_PASSWORD`: Dashboard login password
- `SESSION_SECRET`: Session encryption key
- `CORS_ORIGIN`: CORS origin for API
- `PORT`: Backend port (default: 3000)

**React Frontend**:
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3000)

### Development vs Production

- **Development**: React dev server proxies API calls to backend
- **Production**: Deploy React frontend and backend separately, configure API URL

## 🎨 Features Comparison

| Feature | Legacy Frontend | React Frontend |
|---------|----------------|----------------|
| Technology | Vanilla JS + HTML | React + Next.js + TypeScript |
| Real-time Updates | ✅ Socket.io | ✅ Socket.io |
| Responsive Design | ✅ Tailwind CSS | ✅ Tailwind CSS |
| Type Safety | ❌ | ✅ TypeScript |
| Component Reusability | ❌ | ✅ React Components |
| Hot Reload | ❌ | ✅ Next.js |
| Code Splitting | ❌ | ✅ Next.js |
| SEO Optimization | ❌ | ✅ Next.js |
| Development Experience | Basic | ✅ Enhanced |

## 🧩 React Components

### Core Components

- **`Header`**: Navigation bar with controls
- **`FleetGrid`**: Grid layout for PBX cards
- **`HealthCard`**: Individual PBX status card
- **`PBXModal`**: Add/edit PBX form modal
- **`EmptyState`**: No PBX instances placeholder

### Component Props

```typescript
interface PBXData {
  id: string;
  name: string;
  url: string;
  health: PBXHealth;
}

interface PBXHealth {
  status: 'healthy' | 'warning' | 'critical' | 'error';
  connected: boolean;
  issues?: string[];
  trunks: { registered: number; total: number };
  extensions: { online: number; total: number };
  calls: { active: number; max: number };
  lastCheck: string;
}
```

## 🔄 Migration Guide

### From Legacy to React

1. **Keep backend unchanged** - The React frontend uses the same API
2. **Deploy React frontend** on port 3001
3. **Update reverse proxy** to point to React frontend
4. **Test thoroughly** with your PBX instances
5. **Switch traffic** when ready

### Gradual Migration

You can run both frontends simultaneously:
- Legacy: http://localhost:3000
- React: http://localhost:3001
- Same backend serves both

## 🛠️ Development

### Adding New Features

1. **Backend changes**: Modify `/backend/src/`
2. **React components**: Add to `/frontend-react/src/components/`
3. **Types**: Update `/frontend-react/src/types/`
4. **Styling**: Use Tailwind CSS classes

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended rules
- **Prettier**: Automatic formatting
- **Components**: Functional components with hooks

### Testing

```bash
# Backend tests (if added)
cd backend
npm test

# Frontend tests (if added)
cd frontend-react
npm test
```

## 📊 Performance

### React Optimizations

- **Code Splitting**: Automatic with Next.js
- **Image Optimization**: Next.js Image component
- **Bundle Analysis**: `npm run build` shows bundle size
- **Lazy Loading**: Components loaded on demand

### Monitoring

- **Real-time Updates**: Socket.io connection status
- **Error Boundaries**: Graceful error handling
- **Loading States**: User feedback during operations

## 🔒 Security

Same security considerations as the original, plus:

- **TypeScript**: Compile-time type checking
- **Input Validation**: Client-side validation with server verification
- **XSS Protection**: React's built-in XSS protection
- **CSRF**: Same-origin policy enforcement

## 🐛 Troubleshooting

### Common Issues

1. **"Cannot connect to backend"**:
   - Ensure backend is running on port 3000
   - Check CORS configuration
   - Verify API proxy in `next.config.js`

2. **"Socket.io connection failed"**:
   - Backend must be running
   - Check firewall settings
   - Verify Socket.io proxy configuration

3. **"Build fails"**:
   - Run `npm install` in frontend-react
   - Check TypeScript errors: `npm run lint`
   - Verify all imports are correct

### Development Tips

- Use browser dev tools for debugging
- Check Network tab for API calls
- Monitor Console for errors
- Use React Developer Tools extension

## 🚀 Production Deployment

### Build Process

```bash
cd frontend-react
npm run build
npm start
```

### Environment Setup

1. **Backend**: Same as original setup
2. **Frontend**: Set `NEXT_PUBLIC_API_URL` to your backend URL
3. **Reverse Proxy**: Point to React frontend (port 3001)

### Dokploy Configuration

Create two services:

1. **Backend Service**:
   - Port: 3000
   - Environment: Production backend vars

2. **Frontend Service**:
   - Port: 3001
   - Environment: `NEXT_PUBLIC_API_URL=https://your-backend-url`

## 📝 License

MIT License - same as original project

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/react-enhancement`
3. Make changes in `/frontend-react/`
4. Test with existing backend
5. Submit pull request

## 📞 Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: This README + original README.md

---

**🎉 Enjoy your modern React-powered MSP Fleet Dashboard!**

The React edition provides the same powerful PBX monitoring capabilities with a modern, maintainable codebase that's ready for future enhancements.