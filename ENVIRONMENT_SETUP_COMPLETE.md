# Complete Environment Setup Guide

## 🚀 Local Development Setup

### 1. Prerequisites
```bash
# Install Node.js 18+ and npm
node --version  # Should be 18+
npm --version   # Should be 9+
```

### 2. Environment Variables
Create `.env.local` file in project root:
```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ems?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# API Configuration
NEXT_PUBLIC_API_BASE=http://localhost:3000

# Environment
NODE_ENV=development
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```

## 🌐 Netlify Deployment Setup

### 1. Environment Variables in Netlify
Go to Site Settings > Environment Variables and add:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ems?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

### 2. Build Settings
- Build Command: `npm run build`
- Publish Directory: `.next`
- Node Version: 18

### 3. Deploy
```bash
# Connect to Netlify
netlify login
netlify init
netlify deploy --prod
```

## 🔧 Database Setup

### 1. MongoDB Atlas Setup
1. Create MongoDB Atlas account
2. Create cluster
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for development)
5. Get connection string

### 2. Database Collections
The app will automatically create these collections:
- `users` - User accounts
- `visitors` - Visitor information
- `enquiries` - Enquiry details
- `chatmessages` - Chat messages
- `articles` - Knowledge base articles
- `faqs` - Frequently asked questions

## 🛠️ Troubleshooting

### Common Issues

#### 1. MongoDB Connection Issues
```bash
# Check if MongoDB URI is correct
echo $MONGODB_URI

# Test connection
node -e "console.log(process.env.MONGODB_URI)"
```

#### 2. Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 3. API Errors
- Check browser console for errors
- Check Netlify function logs
- Verify environment variables

### Debug Commands

#### Test Database Connection
```bash
curl http://localhost:3000/api/test-database
```

#### Test Authentication
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

#### Test API Health
```bash
curl http://localhost:3000/api/test-server
```

## 📊 Performance Optimization

### 1. Database Indexes
```javascript
// Add these indexes to MongoDB
db.visitors.createIndex({ "email": 1 })
db.visitors.createIndex({ "phone": 1 })
db.visitors.createIndex({ "createdAt": -1 })
db.enquiries.createIndex({ "visitorId": 1 })
db.enquiries.createIndex({ "createdAt": -1 })
```

### 2. Caching
- API responses are cached for 5 minutes
- Static assets are cached for 1 year
- Database queries use connection pooling

### 3. Error Handling
- All API endpoints have fallback data
- Database connection failures use memory storage
- Frontend components have error boundaries

## 🔒 Security Checklist

### 1. Environment Variables
- [ ] JWT_SECRET is strong and unique
- [ ] MONGODB_URI uses authentication
- [ ] No sensitive data in client-side code

### 2. Database Security
- [ ] Database user has limited permissions
- [ ] IP whitelist is configured
- [ ] Connection string is encrypted

### 3. API Security
- [ ] All API routes validate authentication
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented

## 📈 Monitoring

### 1. Health Checks
- `/api/test-server` - Server health
- `/api/test-database` - Database health
- `/api/debug-auth` - Authentication status

### 2. Logging
- All API calls are logged
- Errors are tracked
- Performance metrics available

### 3. Analytics
- Visitor tracking
- Conversion rates
- User engagement metrics

## 🚀 Deployment Checklist

### Before Deployment
- [ ] All environment variables set
- [ ] Database connection tested
- [ ] Build process works locally
- [ ] All tests pass

### After Deployment
- [ ] Health checks pass
- [ ] Authentication works
- [ ] Database queries work
- [ ] All pages load correctly

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Check Netlify function logs
3. Verify environment variables
4. Test database connection
5. Check API endpoints manually

## 🔄 Updates

To update the application:

1. Pull latest changes
2. Update dependencies: `npm update`
3. Test locally: `npm run dev`
4. Deploy: `netlify deploy --prod`

## 📝 Notes

- The application uses Next.js 14 with App Router
- Database operations have comprehensive fallbacks
- All components have error boundaries
- API endpoints are optimized for serverless deployment
- Memory storage is used when database is unavailable
