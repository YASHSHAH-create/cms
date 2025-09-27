# 🔧 Environment Variables Setup

## Required Environment Variables

Add these to your Netlify environment variables:

### Database Configuration
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
JWT_SECRET=your-super-secret-jwt-key-here
```

### API Configuration
```
NEXT_PUBLIC_API_BASE=https://newems.netlify.app
```

### Admin User Configuration (NO HARDCODED DATA)
```
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@envirocarelabs.com
ADMIN_NAME=Administrator
ADMIN_PASSWORD=your-secure-admin-password
```

### Demo User Configuration (Optional)
```
DEMO_USERNAME=demo
DEMO_EMAIL=demo@envirocarelabs.com
DEMO_NAME=Demo User
DEMO_PASSWORD=demo123
```

### Environment
```
NODE_ENV=production
```

## How to Add to Netlify:

1. Go to Netlify Dashboard
2. Select your site
3. Go to Site Settings > Environment Variables
4. Add each variable above
5. Redeploy your site

## Benefits:
- ✅ No hardcoded user data
- ✅ Secure password management
- ✅ Environment-specific configuration
- ✅ Eliminates "Sanjana Pawar" issue