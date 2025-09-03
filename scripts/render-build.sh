#!/bin/bash

# Render Build Script for Weather Dashboard
echo "🎨 Starting Render build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build the application
echo "🔨 Building application..."
npm run build

# Verify build output
if [ -d "dist" ]; then
    echo "✅ Build successful! Output directory created."
    ls -la dist/
else
    echo "❌ Build failed! No dist directory found."
    exit 1
fi

echo "🎉 Render build complete!"