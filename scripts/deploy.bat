@echo off
echo 🚀 Starting deployment process...

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Install dependencies
echo 📦 Installing dependencies...
npm install

REM Build the application
echo 🔨 Building application...
npm run build

REM Check if build was successful
if %errorlevel% equ 0 (
    echo ✅ Build successful!
) else (
    echo ❌ Build failed!
    pause
    exit /b 1
)

REM Create environment file for deployment
echo 📝 Creating environment configuration...
echo NODE_ENV=production > .env.production
echo NEXT_PUBLIC_API_BASE=https://your-app.netlify.app >> .env.production

echo 🎉 Deployment preparation complete!
echo.
echo Next steps:
echo 1. Set environment variables in Netlify dashboard:
echo    - MONGODB_URI=your-mongodb-connection-string
echo    - JWT_SECRET=your-jwt-secret
echo 2. Deploy to Netlify using one of these methods:
echo    - Drag and drop the .next folder to Netlify
echo    - Connect your GitHub repository to Netlify
echo    - Use Netlify CLI: netlify deploy --prod
pause
