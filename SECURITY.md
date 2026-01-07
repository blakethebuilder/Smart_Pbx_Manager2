# Security Configuration

## Password Setup

The PBX Dashboard requires a secure password to be set before deployment.

### For Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Set your password in `.env`:
   ```bash
   MASTER_PASSWORD=your_secure_password_here
   ```

### For Production Deployment

#### Option 1: Using the Setup Script
```bash
./scripts/setup-production-password.sh "YourSecurePassword123!"
```

#### Option 2: Manual Setup
1. Set the environment variable:
   ```bash
   export MASTER_PASSWORD="YourSecurePassword123!"
   ```

2. Deploy with Docker:
   ```bash
   docker-compose up -d --build
   ```

#### Option 3: Docker Environment File
Create a `.env.production` file:
```bash
MASTER_PASSWORD=YourSecurePassword123!
```

Then deploy:
```bash
docker-compose --env-file .env.production up -d --build
```

## Password Requirements

- Minimum 8 characters
- Use a combination of letters, numbers, and special characters
- Avoid common passwords or dictionary words
- Don't use the default placeholder password

## Security Best Practices

1. **Never commit passwords to version control**
2. **Use environment variables for sensitive data**
3. **Regularly rotate passwords**
4. **Use HTTPS in production**
5. **Restrict access to authorized users only**

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MASTER_PASSWORD` | Dashboard login password | Yes | None |
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `8547` |

## Troubleshooting

### "Password not configured" Error
If you see this error, it means the `MASTER_PASSWORD` environment variable is not set or is using the default placeholder value.

**Solution:**
1. Set the `MASTER_PASSWORD` environment variable
2. Restart the application

### Docker Deployment Issues
Make sure the environment variable is passed to the container:
```bash
docker run -e MASTER_PASSWORD="YourPassword" your-image
```

Or use docker-compose with environment variables properly configured.