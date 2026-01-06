# MSP PBX Dashboard - YCM Cloud Edition

A production-ready dashboard for monitoring multiple Yeastar YCM Cloud PBX instances with intelligent token caching and rate limit handling.

## 🎯 Features

- **Real-time Monitoring**: Live extension and trunk status updates
- **Multi-PBX Support**: Monitor unlimited YCM Cloud instances
- **Smart Token Caching**: Avoids API rate limits with intelligent token reuse
- **Rate Limit Handling**: Graceful handling of YCM Cloud API limitations
- **Socket.io Updates**: Real-time dashboard updates every 5 minutes
- **Production Ready**: Optimized for MSP environments

## 🚀 Quick Start

### Local Development

```bash
npm install
npm start
```

Open http://localhost:8547
Login with password: `Smart@2026!`

### Docker Deployment

```bash
docker build -t msp-pbx-dashboard .
docker run -p 8547:8547 msp-pbx-dashboard
```

## 📊 Dashboard Features

### PBX Monitoring Cards Show:
- **Extensions**: Total extension count
- **Registered**: Currently registered extensions  
- **Trunks**: Total trunk count
- **Active Trunks**: Currently active trunks
- **Active Calls**: Real-time call count (when available)
- **Connection Status**: Live API connectivity status

### Management Features:
- **Clickable PBX URLs**: Direct access to PBX web interfaces
- **Manual Testing**: Test individual PBX connections
- **Real-time Updates**: Automatic status refresh via WebSocket
- **Error Handling**: Clear status messages for connection issues

## 🔧 YCM Cloud Configuration

### API Setup in PBX:
1. Login to your YCM Cloud PBX web interface
2. Navigate to **Integration** → **API**
3. Create new API application with:
   - **Application Name**: MSP Dashboard
   - **Username**: Your API username (Client ID)
   - **Password**: Your API password (Client Secret)
4. Note the credentials for dashboard configuration

### Adding PBX Instances:
1. Click "Add PBX Instance" in dashboard
2. Enter details:
   - **Name**: Descriptive name (e.g., "Client ABC PBX")
   - **URL**: `https://[subdomain].pbx.ycmcloud.co.za`
   - **App ID**: API Username from PBX
   - **App Secret**: API Password from PBX

## 🏢 Shared PBX Optimization

### Smart Rate Limit Management:
The dashboard automatically detects and optimizes for shared PBX instances:

**Shared PBX Instances** (Multiple customers on same subdomain):
- `smart1.pbx.yeastarycm.co.za` 
- `smart2.pbx.yeastarycm.co.za`
- `smart3.pbx.yeastarycm.co.za`

**Optimization Features**:
- ✅ **Single API Call**: Extensions/trunks fetched once per shared PBX
- ✅ **Data Caching**: Shared data cached for 2 minutes across all customers
- ✅ **Rate Limit Protection**: Prevents duplicate API calls to same PBX
- ✅ **Token Efficiency**: One token serves multiple customers on shared PBX

**Example Scenario**:
```
Customers on smart1.pbx.yeastarycm.co.za:
- Brents Auto
- Dent City Bellville  
- Dr Phalane
- FJ Stainless Steel
- Mirkhon Motors
- Q-Law
- Talisman

Result: Only 1 API call for extensions/trunks data
Shared across all 7 customers automatically!
```

### Bulk Import Support:
```bash
# Use the provided CSV template
cp pbx-import-template.csv my-pbx-list.csv
# Edit with your credentials
# Import via API or manual entry
```

## ⚡ API Rate Limits & Optimization

### YCM Cloud Limitations:
- **Max Tokens**: 8 concurrent valid tokens per PBX
- **Token Lifetime**: 30 minutes each
- **Rate Limit Error**: "MAX LIMITATION EXCEEDED"

### Our Solutions:
- **Smart Caching**: Reuses tokens for 28 minutes (2min safety buffer)
- **Per-PBX Tokens**: Each instance has independent token cache
- **Graceful Handling**: Clear error messages during rate limits
- **Auto Recovery**: Automatic retry when limits reset

### Health Check Frequency:
- **Production**: Every 5 minutes (optimized for rate limits)
- **Manual Tests**: Available anytime (uses cached tokens)
- **Real-time Updates**: Instant WebSocket notifications

## 🔐 Security & Authentication

### Dashboard Access:
- **Password Protection**: Configurable master password
- **Environment Variable**: `MASTER_PASSWORD=Smart@2026!`
- **Session Management**: Secure login handling

### API Security:
- **Credential Storage**: Encrypted in pbx-data.json
- **Token Caching**: In-memory only (not persisted)
- **HTTPS Required**: All PBX connections use HTTPS

## 📡 API Endpoints

### Dashboard API:
- `GET /api/pbx` - List all PBX instances
- `POST /api/pbx` - Add new PBX instance
- `DELETE /api/pbx/:id` - Remove PBX instance
- `POST /api/pbx/:id/test` - Manual health test
- `POST /api/login` - Dashboard authentication

### Health Monitoring:
- `GET /health` - Service health check
- `GET /test` - API functionality test
- `POST /debug/test-api` - Raw API testing

## 🛠️ Configuration

### Environment Variables (.env):
```bash
# Required
MASTER_PASSWORD=Smart@2026!
NODE_ENV=production
PORT=8547

# Optional  
SESSION_SECRET=your-session-secret
CORS_ORIGIN=*
```

### Data Storage:
- **PBX Config**: `pbx-data.json` (auto-created)
- **Token Cache**: In-memory (not persisted)
- **Logs**: Console output

## 🚨 Troubleshooting

### Rate Limit Issues:
**Error**: "MAX LIMITATION EXCEEDED"
**Solution**: Wait 30-60 minutes for reset, system will auto-recover

### Connection Problems:
**Error**: "Connection timeout"
**Check**: 
- PBX URL format: `https://subdomain.pbx.ycmcloud.co.za`
- API credentials are correct
- PBX API is enabled

### Authentication Failures:
**Error**: "Invalid credentials"
**Check**:
- Username/Password in PBX API settings
- API application is enabled
- Credentials match exactly

## 📈 Production Deployment

### Recommended Setup:
- **Health Checks**: Every 5+ minutes
- **Token Caching**: Enabled (default)
- **Multiple PBX**: Unlimited instances supported
- **Monitoring**: Built-in error handling and recovery

### Scaling Considerations:
- Each PBX instance uses ~1 API token per 30 minutes
- Monitor rate limits if adding many instances quickly
- Consider staggered health checks for large deployments

## 🔄 API Integration Details

### YCM Cloud Specifics:
- **Token Endpoint**: `/openapi/v1.0/get_token`
- **Auth Method**: Username/Password (not OAuth client credentials)
- **Extension API**: `/openapi/v1.0/extension/query`
- **Trunk API**: `/openapi/v1.0/trunk/query`

### Token Management:
```javascript
// Automatic token caching per PBX
Cache Key: `${pbxUrl}_${appId}`
Cache Duration: 28 minutes (with 2min buffer)
Auto Refresh: When token expires
```

---

## 🎉 Ready for Production

This dashboard is optimized for MSP environments monitoring multiple YCM Cloud PBX instances. The intelligent token caching and rate limit handling ensure reliable operation at scale.

**Perfect for monitoring multiple client PBX systems with different subdomains!** 🚀