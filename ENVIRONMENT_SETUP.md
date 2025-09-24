# 🔧 Environment Variables Setup for Netlify

## Required Environment Variables

Add these to your **Netlify Dashboard** → **Site Settings** → **Environment Variables**:

### 1. **MONGODB_URI** (Required)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name?retryWrites=true&w=majority
```
- Replace with your actual MongoDB connection string
- Must include authentication credentials
- Should include database name

### 2. **JWT_SECRET** (Required)
```
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
```
- Generate a strong secret key (minimum 32 characters)
- Use a random string generator
- Keep this secret and secure

### 3. **NEXT_PUBLIC_APP_URL** (Required)
```
NEXT_PUBLIC_APP_URL=https://your-site-name.netlify.app
```
- Replace with your actual Netlify site URL
- Must include https://
- No trailing slash

## Optional Environment Variables

### 4. **MONGODB_DB_NAME** (Optional)
```
MONGODB_DB_NAME=envirocare-ems
```
- Only needed if database name is not in MONGODB_URI

### 5. **DEBUG** (Optional)
```
DEBUG=true
```
- Enable debug logging
- Set to false in production

## 🔐 How to Generate JWT_SECRET

### Option 1: Online Generator
Visit: https://generate-secret.vercel.app/32

### Option 2: Command Line
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 3: Manual
Create a random string of at least 32 characters:
```
JWT_SECRET=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567890
```

## 📋 Setup Checklist

- [ ] MongoDB connection string ready
- [ ] JWT secret generated (32+ characters)
- [ ] Netlify site URL confirmed
- [ ] All variables added to Netlify dashboard
- [ ] Variables saved and deployed

## 🚨 Common Issues

### "Database connection failed"
- Check MONGODB_URI format
- Verify MongoDB credentials
- Ensure database exists

### "JWT_SECRET environment variable is not set"
- Add JWT_SECRET to Netlify environment variables
- Ensure it's at least 32 characters long

### "Service temporarily unavailable"
- Check MongoDB connection
- Verify network connectivity
- Check MongoDB Atlas IP whitelist

## ✅ Test Your Setup

After setting environment variables, test your functions:

1. **Login Function**: `POST /api/auth/login`
2. **Visitors Function**: `GET /api/visitors`

Both should return proper responses without environment variable errors.
