#!/usr/bin/env node

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up production environment...\n');

// Generate secure keys
const encryptionKey = crypto.randomBytes(32).toString('hex');
const jwtSecret = crypto.randomBytes(64).toString('hex');
const sessionSecret = crypto.randomBytes(32).toString('base64');

// Create logs directory
const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
    console.log('✅ Created logs directory');
}

// Create secure .env.production file
const productionEnv = `# MSP PBX Dashboard - Production Configuration
# Generated on ${new Date().toISOString()}

#### Security Configuration (CHANGE THESE!)
ENCRYPTION_KEY=${encryptionKey}
JWT_SECRET=${jwtSecret}
SESSION_SECRET=${sessionSecret}

#### Authentication
MASTER_PASSWORD=CHANGE_THIS_PASSWORD_IN_PRODUCTION
# Generate hash: node -e "console.log(require('crypto').pbkdf2Sync('YOUR_PASSWORD', 'salt', 10000, 64, 'sha512').toString('hex'))"
MASTER_PASSWORD_HASH=

#### Application Settings
NODE_ENV=production
PORT=3000
LOG_LEVEL=warn
TRUST_PROXY=true

#### CORS & Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

#### Database (Configure when ready)
# DATABASE_URL=postgresql://username:password@localhost:5432/pbx_dashboard
# REDIS_URL=redis://localhost:6379

#### Monitoring & Alerts
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# ALERT_EMAIL=admin@yourcompany.com

#### Commercial Features
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# LICENSE_KEY=your-license-key
`;

fs.writeFileSync('.env.production', productionEnv);
console.log('✅ Created .env.production file');

// Create systemd service file
const systemdService = `[Unit]
Description=MSP PBX Dashboard
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=${process.cwd()}
Environment=NODE_ENV=production
EnvironmentFile=${process.cwd()}/.env.production
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=pbx-dashboard

[Install]
WantedBy=multi-user.target
`;

fs.writeFileSync('pbx-dashboard.service', systemdService);
console.log('✅ Created systemd service file');

// Create nginx configuration
const nginxConfig = `server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
`;

fs.writeFileSync('nginx-pbx-dashboard.conf', nginxConfig);
console.log('✅ Created nginx configuration');

console.log('\n🎉 Production setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Edit .env.production with your actual values');
console.log('2. Copy pbx-dashboard.service to /etc/systemd/system/');
console.log('3. Copy nginx-pbx-dashboard.conf to /etc/nginx/sites-available/');
console.log('4. Enable and start the service: sudo systemctl enable pbx-dashboard');
console.log('5. Start the service: sudo systemctl start pbx-dashboard');
console.log('6. Check status: sudo systemctl status pbx-dashboard');
console.log('\n🔒 Security reminders:');
console.log('- Change the MASTER_PASSWORD in .env.production');
console.log('- Set up SSL certificates');
console.log('- Configure firewall rules');
console.log('- Set up log rotation');
console.log('- Enable fail2ban for additional protection');