#!/bin/bash

# Deployment script for Netlify
echo "🚀 Starting deployment process..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Create environment file for deployment
echo "📝 Creating environment configuration..."
cat > .env.production << EOF
NODE_ENV=production
NEXT_PUBLIC_API_BASE=https://your-app.netlify.app
EOF

echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Set environment variables in Netlify dashboard:"
echo "   - MONGODB_URI=your-mongodb-connection-string"
echo "   - JWT_SECRET=your-jwt-secret"
echo "2. Deploy to Netlify using one of these methods:"
echo "   - Drag and drop the .next folder to Netlify"
echo "   - Connect your GitHub repository to Netlify"
echo "   - Use Netlify CLI: netlify deploy --prod"
