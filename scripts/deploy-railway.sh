#!/bin/bash

# Weather Dashboard - Railway Deployment Script
# This script helps you deploy your Weather Dashboard to Railway

echo "🚂 Weather Dashboard - Railway Deployment"
echo "=========================================="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
    echo "✅ Railway CLI installed"
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

# Check if project is initialized
if [ ! -f "railway.toml" ]; then
    echo "🚀 Initializing Railway project..."
    railway init
fi

# Check for environment variables
echo "🔧 Checking environment variables..."

if [ -z "$VITE_WEATHER_API_KEY" ]; then
    echo "⚠️  VITE_WEATHER_API_KEY not found in environment"
    read -p "Enter your OpenWeatherMap API key: " api_key
    railway variables set VITE_WEATHER_API_KEY="$api_key"
    echo "✅ API key set"
else
    echo "✅ API key found in environment"
fi

# Set other environment variables
echo "🔧 Setting additional environment variables..."
railway variables set VITE_APP_NAME="Weather Dashboard"
railway variables set VITE_ENABLE_PWA=true
railway variables set VITE_ENABLE_OFFLINE=true

# Build and test locally first
echo "🔨 Building project locally..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Local build successful"
else
    echo "❌ Local build failed. Please fix errors before deploying."
    exit 1
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo ""
    echo "Your Weather Dashboard is now live!"
    echo "You can view it at your Railway project URL."
    echo ""
    echo "Next steps:"
    echo "1. Go to your Railway dashboard"
    echo "2. Click 'Settings' → 'Generate Domain' to get your live URL"
    echo "3. Test your deployment with the live URL"
    echo ""
    echo "📖 For more help, see: docs/RAILWAY_DEPLOYMENT.md"
else
    echo "❌ Deployment failed. Check the logs above for errors."
    exit 1
fi