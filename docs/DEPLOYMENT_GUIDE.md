# Weather Dashboard - Deployment Guide

## 🚀 Quick Deploy Links

### **One-Click Deployments**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/ecogetaway/weather-dashboard)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ecogetaway/weather-dashboard&env=VITE_WEATHER_API_KEY)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ecogetaway/weather-dashboard)

---

## 🌐 Live Demo URLs

### **Production Deployments**
- **Vercel**: `https://weather-dashboard-demo.vercel.app`
- **Netlify**: `https://weather-dashboard-demo.netlify.app`
- **GitHub Pages**: `https://your-username.github.io/weather-dashboard`

### **Development/Staging**
- **Vercel Preview**: `https://weather-dashboard-git-main-username.vercel.app`
- **Netlify Branch**: `https://develop--weather-dashboard-demo.netlify.app`

---

## 📋 Prerequisites

### **Required**
- Node.js 18+ 
- npm or yarn package manager
- OpenWeatherMap API key (free at [openweathermap.org](https://openweathermap.org/api))

### **Optional**
- Git for version control
- Modern web browser for testing
- Code editor (VS Code recommended)

---

## ⚡ Quick Start

### **1. Get the Code**
```bash
# Clone the repository
git clone https://github.com/ecogetaway/weather-dashboard.git
cd weather-dashboard

# Install dependencies
npm install
```

### **2. Environment Setup**
```bash
# Create environment file
cp .env.example .env.local

# Add your API key to .env.local
VITE_WEATHER_API_KEY=your_openweathermap_api_key_here
```

### **3. Run Locally**
```bash
# Start development server
npm run dev

# Open http://localhost:5173
```

### **4. Build for Production**
```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

---

## 🔧 Environment Variables

### **Required Variables**
```env
# OpenWeatherMap API Key (Required)
VITE_WEATHER_API_KEY=your_api_key_here
```

### **Optional Variables**
```env
# API Base URL (Optional - defaults to OpenWeatherMap)
VITE_API_BASE_URL=https://api.openweathermap.org/data/2.5

# App Environment (Optional - auto-detected)
VITE_APP_ENV=production

# Performance Monitoring (Optional)
VITE_ENABLE_PERFORMANCE_MONITOR=false
```

---

## 🚂 **Railway Deployment (Recommended)**

Railway is an excellent choice for deploying React applications with generous free tier limits.

### **Why Railway?**
- **$5 free credit monthly** (more than Vercel's bandwidth limits)
- **Unlimited build minutes** on free tier
- **Automatic HTTPS** and SSL certificates
- **Easy GitHub integration**
- **Real-time logs and monitoring**
- **Simple environment variable management**

### **Quick Railway Deployment**

#### **Method 1: GitHub Integration (Easiest)**
1. **Sign up**: Go to [railway.app](https://railway.app)
2. **Connect GitHub**: Sign up with your GitHub account
3. **New Project**: Click "New Project" → "Deploy from GitHub repo"
4. **Select Repo**: Choose your `weather-dashboard` repository
5. **Environment Variables**: 
   - Go to "Variables" tab
   - Add: `VITE_WEATHER_API_KEY=your_openweathermap_api_key`
6. **Deploy**: Railway automatically builds and deploys
7. **Get URL**: Go to "Settings" → "Generate Domain"

#### **Method 2: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Set environment variables
railway variables set VITE_WEATHER_API_KEY=your_api_key_here

# Deploy
railway up
```

### **Railway Configuration** (Already included in your project)
- ✅ `railway.json` - Deployment configuration
- ✅ `nixpacks.toml` - Build settings  
- ✅ Updated `package.json` - Railway-compatible scripts

### **Your Railway URL**
After deployment: `https://your-app-name.up.railway.app`

**📖 Detailed Railway Guide**: [Railway Deployment Documentation](./RAILWAY_DEPLOYMENT.md)

# Debug Mode (Optional - development only)
VITE_DEBUG_MODE=false
```

---

## 🌐 Platform-Specific Deployments

### **Vercel Deployment**

#### **Automatic Deployment**
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on every push

#### **Manual Deployment**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel

# Add environment variables
vercel env add VITE_WEATHER_API_KEY

# Deploy to production
vercel --prod
```

#### **Vercel Configuration** (`vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_WEATHER_API_KEY": "@weather-api-key"
  },
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    }
  ]
}
```

---

### **Netlify Deployment**

#### **Automatic Deployment**
1. Connect GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables in Netlify dashboard

#### **Manual Deployment**
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

#### **Netlify Configuration** (`netlify.toml`)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

### **GitHub Pages Deployment**

#### **GitHub Actions Workflow** (`.github/workflows/deploy.yml`)
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
      env:
        VITE_WEATHER_API_KEY: ${{ secrets.VITE_WEATHER_API_KEY }}
    
    - name: Deploy to GitHub Pages
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

---

### **Railway Deployment**

#### **Railway Configuration**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set VITE_WEATHER_API_KEY=your_api_key

# Deploy
railway up
```

#### **Railway Config** (`railway.toml`)
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm run preview"
healthcheckPath = "/"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

---

## 🔒 Security Configuration

### **Content Security Policy**
Add to your hosting platform's headers:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.openweathermap.org;
```

### **Security Headers**
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 📊 Performance Optimization

### **Build Optimization**
```bash
# Analyze bundle size
npm run build -- --analyze

# Check for unused dependencies
npx depcheck

# Optimize images (if any)
npx imagemin-cli src/assets/* --out-dir=dist/assets
```

### **Caching Strategy**
```
# Static assets (1 year)
Cache-Control: public, max-age=31536000, immutable

# Service worker (no cache)
Cache-Control: public, max-age=0, must-revalidate

# HTML (1 hour)
Cache-Control: public, max-age=3600
```

---

## 🧪 Pre-Deployment Testing

### **Local Testing Checklist**
```bash
# Run all tests
npm test

# Build and test production version
npm run build
npm run preview

# Check accessibility
npm run test:a11y

# Performance audit
npm run lighthouse

# Check for security vulnerabilities
npm audit
```

### **Cross-Browser Testing**
- Chrome (latest)
- Firefox (latest) 
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## 🔍 Monitoring & Analytics

### **Performance Monitoring**
- **Core Web Vitals**: Built-in monitoring
- **Error Tracking**: Console error logging
- **Performance API**: Real-time metrics
- **Lighthouse CI**: Automated performance testing

### **Analytics Setup** (Optional)
```javascript
// Add to index.html if needed
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 🚨 Troubleshooting

### **Common Issues**

#### **Build Failures**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node.js version
node --version  # Should be 18+

# Verify environment variables
echo $VITE_WEATHER_API_KEY
```

#### **API Key Issues**
- Verify API key is valid at OpenWeatherMap
- Check API key has proper permissions
- Ensure environment variable is set correctly
- Test API key with curl:
```bash
curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY"
```

#### **Deployment Issues**
- Check build logs for errors
- Verify environment variables are set on platform
- Ensure correct build command and output directory
- Check for any missing dependencies

### **Debug Mode**
```bash
# Enable debug mode locally
VITE_DEBUG_MODE=true npm run dev

# Check browser console for detailed logs
# Open DevTools → Console
```

---

## 📚 Additional Resources

### **Documentation**
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [OpenWeatherMap API Docs](https://openweathermap.org/api)

### **Tools**
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance auditing
- [WebPageTest](https://www.webpagetest.org/) - Performance testing
- [Can I Use](https://caniuse.com/) - Browser compatibility
- [Bundle Analyzer](https://www.npmjs.com/package/webpack-bundle-analyzer) - Bundle analysis

---

## 📞 Support

Need help with deployment?
- **GitHub Issues**: Technical deployment problems
- **Platform Support**: Contact your hosting platform's support
- **API Issues**: Check OpenWeatherMap documentation
- **General Help**: Create a discussion in the repository

---

**Happy Deploying! 🚀**

*Last Updated: December 2024*