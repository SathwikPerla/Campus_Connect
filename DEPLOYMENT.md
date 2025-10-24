# WhisprNet Deployment Guide

## 🚀 Production Deployment

This guide covers deploying WhisprNet to production environments.

## 📋 Prerequisites

- Node.js 16+ installed
- MongoDB Atlas account or MongoDB instance
- Domain name (optional)
- SSL certificate (recommended)

## 🌐 Deployment Options

### Option 1: Heroku (Recommended for beginners)

#### Backend Deployment

1. **Create Heroku App**
   ```bash
   cd server
   heroku create your-app-name-backend
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set MONGO_URI="your-mongodb-atlas-uri"
   heroku config:set JWT_SECRET="your-production-jwt-secret"
   heroku config:set NODE_ENV="production"
   heroku config:set CLIENT_URL="https://your-frontend-domain.com"
   heroku config:set MODERATION_API_KEY="your-moderation-api-key"
   heroku config:set GOOGLE_CLIENT_ID="your-google-client-id"
   heroku config:set GOOGLE_CLIENT_SECRET="your-google-client-secret"
   heroku config:set EMAIL_USER="your-email@domain.com"
   heroku config:set EMAIL_PASS="your-email-password"
   ```

3. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy to production"
   git push heroku main
   ```

#### Frontend Deployment (Vercel)

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set root directory to `client`

2. **Environment Variables**
   ```
   VITE_API_URL=https://your-backend-domain.herokuapp.com
   VITE_GOOGLE_CLIENT_ID=your-google-client-id
   ```

3. **Deploy**
   - Vercel will automatically deploy on push to main branch

### Option 2: DigitalOcean App Platform

1. **Create App**
   - Go to DigitalOcean App Platform
   - Create new app from GitHub repository

2. **Configure Services**
   - **Backend Service:**
     - Source: `server/`
     - Build Command: `npm install`
     - Run Command: `npm start`
     - Environment Variables: Set all required variables

   - **Frontend Service:**
     - Source: `client/`
     - Build Command: `npm install && npm run build`
     - Output Directory: `dist`
     - Environment Variables: Set VITE_ variables

### Option 3: AWS (Advanced)

#### Backend (EC2 + RDS)

1. **Launch EC2 Instance**
   - Ubuntu 20.04 LTS
   - t3.micro (free tier eligible)

2. **Install Dependencies**
   ```bash
   sudo apt update
   sudo apt install nodejs npm nginx
   ```

3. **Deploy Application**
   ```bash
   git clone your-repo
   cd WhisprNet/server
   npm install
   npm install -g pm2
   ```

4. **Configure PM2**
   ```bash
   pm2 start index.js --name "whisprnet-api"
   pm2 startup
   pm2 save
   ```

5. **Configure Nginx**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:5000;
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

#### Frontend (S3 + CloudFront)

1. **Build Application**
   ```bash
   cd client
   npm run build
   ```

2. **Upload to S3**
   - Create S3 bucket
   - Upload `dist/` contents
   - Enable static website hosting

3. **Configure CloudFront**
   - Create CloudFront distribution
   - Point to S3 bucket
   - Configure custom domain

## 🔧 Environment Configuration

### Production Environment Variables

#### Backend (.env)
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/whisprnet
JWT_SECRET=your-super-secure-jwt-secret-key
CLIENT_URL=https://your-frontend-domain.com
MODERATION_API_KEY=your-perspective-api-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASS=your-email-password
```

#### Frontend (.env)
```env
VITE_API_URL=https://your-backend-domain.com
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use strong, unique secrets for production
- Rotate secrets regularly

### 2. Database Security
- Use MongoDB Atlas with IP whitelisting
- Enable authentication
- Use strong passwords
- Enable SSL/TLS connections

### 3. API Security
- Implement rate limiting
- Use HTTPS in production
- Validate all inputs
- Sanitize user data

### 4. CORS Configuration
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));
```

## 📊 Monitoring & Logging

### 1. Application Monitoring
- Use PM2 for process management
- Implement health checks
- Monitor memory and CPU usage

### 2. Error Tracking
- Integrate Sentry for error tracking
- Log all errors to external service
- Set up alerts for critical errors

### 3. Performance Monitoring
- Use New Relic or similar service
- Monitor API response times
- Track database query performance

## 🚀 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: cd server && npm install
      - run: cd server && npm test
      - run: git push heroku main
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: cd client && npm install
      - run: cd client && npm run build
      - run: npm install -g vercel
      - run: vercel --prod --token ${{ secrets.VERCEL_TOKEN }}
```

## 🔄 Database Migrations

### Backup Strategy
```bash
# MongoDB backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/whisprnet" --out=backup/

# Restore
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/whisprnet" backup/whisprnet/
```

## 📈 Scaling Considerations

### 1. Horizontal Scaling
- Use load balancers
- Implement session management
- Use Redis for caching

### 2. Database Scaling
- Use MongoDB sharding
- Implement read replicas
- Optimize queries

### 3. CDN Implementation
- Use CloudFlare or similar
- Cache static assets
- Implement edge computing

## 🛠 Maintenance

### 1. Regular Updates
- Keep dependencies updated
- Monitor security advisories
- Test updates in staging

### 2. Performance Optimization
- Monitor slow queries
- Optimize images
- Implement caching

### 3. Backup Strategy
- Daily database backups
- Regular code backups
- Test restore procedures

## 📞 Support & Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check CLIENT_URL environment variable
   - Verify CORS configuration

2. **Database Connection Issues**
   - Check MongoDB URI
   - Verify network access
   - Check authentication

3. **Authentication Issues**
   - Verify JWT_SECRET
   - Check token expiration
   - Validate user sessions

### Monitoring Commands
```bash
# Check application status
pm2 status

# View logs
pm2 logs whisprnet-api

# Restart application
pm2 restart whisprnet-api

# Monitor resources
pm2 monit
```

## 🎯 Performance Optimization

### 1. Frontend Optimization
- Enable gzip compression
- Optimize images
- Implement lazy loading
- Use CDN for static assets

### 2. Backend Optimization
- Implement caching
- Optimize database queries
- Use connection pooling
- Implement pagination

### 3. Database Optimization
- Create proper indexes
- Optimize query patterns
- Use aggregation pipelines
- Monitor query performance

---

**WhisprNet** - Deployed and ready for production! 🚀




