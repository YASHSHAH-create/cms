# 🚀 How to Run and Check Your Project

## 📋 **Prerequisites**

Before running the project, make sure you have:
- Node.js 18+ installed
- MongoDB database (local or cloud)
- Environment variables configured

## 🔧 **Step 1: Install Dependencies**

```bash
npm install
```

## 🔑 **Step 2: Set Up Environment Variables**

Create a `.env.local` file in your project root:

```bash
# Copy the example file
cp .env.example .env.local
```

Then edit `.env.local` with your actual values:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/envirocare-ems
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# JWT Secret (generate a strong secret key)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🏃 **Step 3: Run Development Server**

```bash
npm run dev
```

This will start the development server at `http://localhost:3000`

## 🧪 **Step 4: Test Your Application**

### **Frontend Testing:**
1. **Home Page**: Visit `http://localhost:3000`
2. **Login Page**: Visit `http://localhost:3000/login`
3. **Register Page**: Visit `http://localhost:3000/register`
4. **Dashboard**: Visit `http://localhost:3000/dashboard/admin` (after login)

### **API Testing:**
Test your API endpoints:

```bash
# Test login endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'

# Test visitors endpoint
curl http://localhost:3000/api/visitors

# Test environment endpoint
curl http://localhost:3000/api/test-env
```

### **Netlify Functions Testing:**
Test your Netlify functions locally:

```bash
# Test auth-login function
curl -X POST http://localhost:3000/.netlify/functions/auth-login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'

# Test visitors function
curl http://localhost:3000/.netlify/functions/visitors

# Test test function
curl http://localhost:3000/.netlify/functions/test
```

## 🔍 **Step 5: Check Project Health**

### **Build Test:**
```bash
npm run build
```

### **Lint Check:**
```bash
npm run lint
```

### **Type Check:**
```bash
npx tsc --noEmit
```

## 📊 **Step 6: Verify All Components**

### **Check File Structure:**
```bash
# Verify main directories exist
ls -la app/
ls -la components/
ls -la lib/
ls -la netlify-functions/
```

### **Check Key Files:**
- ✅ `package.json` - Dependencies
- ✅ `next.config.ts` - Next.js config
- ✅ `tsconfig.json` - TypeScript config
- ✅ `netlify.toml` - Netlify config
- ✅ `.env.local` - Environment variables

## 🚀 **Step 7: Production Build Test**

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🧪 **Step 8: Test All Features**

### **Authentication Flow:**
1. Register a new user
2. Login with credentials
3. Access protected dashboard routes

### **Dashboard Features:**
1. Admin dashboard: `/dashboard/admin`
2. Executive dashboard: `/dashboard/executive`
3. Customer Executive dashboard: `/dashboard/customer-executive`

### **API Endpoints:**
1. Authentication: `/api/auth/*`
2. Visitors: `/api/visitors`
3. Analytics: `/api/analytics/*`
4. Chat: `/api/chat/*`

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **Port Already in Use:**
   ```bash
   # Kill process on port 3000
   npx kill-port 3000
   # Then run again
   npm run dev
   ```

2. **MongoDB Connection Issues:**
   - Check MongoDB is running
   - Verify connection string in `.env.local`
   - Check network connectivity

3. **Build Errors:**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

4. **Import Errors:**
   - Verify all imports use `@/` aliases
   - Check `tsconfig.json` path mapping

## 📱 **Step 9: Test on Different Devices**

1. **Desktop**: Test on Chrome, Firefox, Safari
2. **Mobile**: Test responsive design
3. **Tablet**: Test medium screen sizes

## 🚀 **Step 10: Deploy to Netlify**

1. **Push to Git:**
   ```bash
   git add .
   git commit -m "Project restructured and ready for deployment"
   git push
   ```

2. **Deploy on Netlify:**
   - Connect your repository
   - Set environment variables
   - Deploy

3. **Test Live Site:**
   - Test all functions
   - Verify API endpoints
   - Check responsive design

## ✅ **Success Checklist**

- [ ] Development server runs without errors
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Dashboard routes are accessible
- [ ] API endpoints respond correctly
- [ ] Netlify functions work
- [ ] Build completes successfully
- [ ] Production server runs
- [ ] Responsive design works
- [ ] All features functional

## 🎯 **Quick Start Commands**

```bash
# Install and run
npm install
npm run dev

# Test build
npm run build

# Test production
npm start

# Check everything
npm run lint && npm run build
```

**Your project is ready to run!** 🎉
