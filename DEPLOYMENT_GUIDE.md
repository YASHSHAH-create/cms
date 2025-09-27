# 🚀 Complete Deployment Guide

## **CRITICAL ISSUE FIXED** ✅

The build showed MongoDB connection errors due to an invalid option `bufferMaxEntries`. This has been fixed in the configuration.

## **Deployment Options**

### **Option 1: Netlify Dashboard (Recommended)**

#### **Step 1: Prepare Your Repository**
```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### **Step 2: Connect to Netlify**
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Select your repository

#### **Step 3: Configure Build Settings**
- **Build Command**: `npm run build`
- **Publish Directory**: `.next`
- **Node Version**: 18

#### **Step 4: Set Environment Variables**
In Netlify Dashboard → Site Settings → Environment Variables:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ems?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

#### **Step 5: Deploy**
Click "Deploy site" and wait for deployment to complete.

---

### **Option 2: Netlify CLI**

#### **Step 1: Install Netlify CLI**
```bash
npm install -g netlify-cli
```

#### **Step 2: Login to Netlify**
```bash
netlify login
```

#### **Step 3: Initialize Netlify**
```bash
netlify init
```

#### **Step 4: Set Environment Variables**
```bash
netlify env:set MONGODB_URI "mongodb+srv://username:password@cluster.mongodb.net/ems?retryWrites=true&w=majority"
netlify env:set JWT_SECRET "your-super-secret-jwt-key-here"
netlify env:set NODE_ENV "production"
```

#### **Step 5: Deploy**
```bash
# Deploy to preview
netlify deploy

# Deploy to production
netlify deploy --prod
```

---

### **Option 3: Manual Upload**

#### **Step 1: Build Locally**
```bash
npm run build
```

#### **Step 2: Upload to Netlify**
1. Go to Netlify Dashboard
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the `.next` folder
4. Set environment variables in Site Settings

---

## **Environment Variables Required**

### **Required Variables:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/ems?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

### **Optional Variables:**
```env
NEXT_PUBLIC_API_BASE=https://your-app.netlify.app
```

---

## **MongoDB Atlas Setup**

### **Step 1: Create MongoDB Atlas Account**
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free account
3. Create a new cluster

### **Step 2: Configure Database**
1. Create a database user
2. Whitelist IP addresses (0.0.0.0/0 for all IPs)
3. Get connection string

### **Step 3: Connection String Format**
```
mongodb+srv://username:password@cluster.mongodb.net/ems?retryWrites=true&w=majority
```

---

## **Post-Deployment Testing**

### **Test Endpoints:**
1. **Health Check**: `https://your-app.netlify.app/api/test-server`
2. **Database Test**: `https://your-app.netlify.app/api/test-database`
3. **Login Test**: Try logging in with admin credentials

### **Test User Credentials:**
- **Admin**: username: `admin`, password: `admin123`
- **Executive**: username: `sanjana`, password: `sanjana123`

---

## **Troubleshooting**

### **Common Issues:**

#### **1. Build Failures**
```bash
# Clear cache and rebuild
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

#### **2. MongoDB Connection Issues**
- Check if MONGODB_URI is correctly set
- Verify MongoDB Atlas cluster is running
- Check IP whitelist in MongoDB Atlas

#### **3. Environment Variables Not Working**
- Ensure variables are set in Netlify dashboard
- Redeploy after setting variables
- Check variable names are correct

#### **4. API Routes Not Working**
- Check Netlify function logs
- Verify all API routes are in `/api` folder
- Test individual endpoints

---

## **Performance Optimization**

### **Netlify Configuration:**
The `netlify.toml` file is already configured with:
- ✅ Optimized build settings
- ✅ Security headers
- ✅ Caching rules
- ✅ API route configuration

### **Database Optimization:**
- ✅ Connection pooling
- ✅ Retry logic
- ✅ Fallback to memory storage
- ✅ Error handling

---

## **Monitoring & Maintenance**

### **Health Checks:**
- Monitor `/api/test-server` endpoint
- Check Netlify function logs
- Monitor MongoDB Atlas metrics

### **Updates:**
```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm update

# Redeploy
netlify deploy --prod
```

---

## **Security Checklist**

- ✅ Environment variables are secure
- ✅ MongoDB user has limited permissions
- ✅ JWT secret is strong and unique
- ✅ API routes have authentication
- ✅ Input validation on all endpoints

---

## **Support**

If you encounter issues:

1. **Check Netlify Function Logs**: Site Settings → Functions → View logs
2. **Test API Endpoints**: Use browser or Postman
3. **Verify Environment Variables**: Site Settings → Environment Variables
4. **Check MongoDB Atlas**: Ensure cluster is running and accessible

---

## **Success Indicators**

✅ **Deployment Successful When:**
- Build completes without errors
- All environment variables are set
- Health check endpoints return success
- Login functionality works
- Dashboard loads without errors
- API endpoints respond correctly

🎉 **Your application is now live and ready to use!**