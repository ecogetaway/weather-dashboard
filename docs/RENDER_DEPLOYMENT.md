# Weather Dashboard - Render Deployment Guide

## 🎨 **Deploy to Render**

Render is an excellent platform for deploying React applications with a generous free tier and reliable performance.

### **Why Render?**
- **750 hours/month free** (more than enough for personal projects)
- **Automatic deployments** from GitHub
- **Easy SSL certificates** and custom domains
- **Reliable build process** with good error reporting
- **No cold starts** on free tier (unlike some competitors)

---

## 🚀 **Quick Deployment Steps**

### **Method 1: One-Click Deploy**
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/ecogetaway/weather-dashboard)

### **Method 2: Manual Setup (Recommended)**

#### **Step 1: Sign Up for Render**
1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

#### **Step 2: Create New Web Service**
1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `ecogetaway/weather-dashboard`
3. Configure the service:

**Basic Settings:**
- **Name**: `weather-dashboard`
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main`

**Build & Deploy Settings:**
- **Build Command**: `npm ci && npm run build`
- **Start Command**: `npm run preview`
- **Node Version**: `18`

#### **Step 3: Environment Variables**
Add these environment variables in Render dashboard:

```bash
# Required
VITE_WEATHER_API_KEY=your_openweathermap_api_key_here

# Optional
VITE_APP_NAME=Weather Dashboard
VITE_ENABLE_PWA=true
VITE_ENABLE_OFFLINE=true
NODE_VERSION=18
```

#### **Step 4: Deploy**
1. Click "Create Web Service"
2. Render will automatically build and deploy your app
3. You'll get a live URL like: `https://weather-dashboard-xyz.onrender.com`

---

## ⚙️ **Configuration Details**

### **Render Configuration File** (`render.yaml`)
```yaml
services:
  - type: web
    name: weather-dashboard
    env: node
    plan: free
    buildCommand: npm ci && npm run build
    startCommand: npm run preview
    healthCheckPath: /
    envVars:
      - key: NODE_VERSION
        value: 18
      - key: VITE_WEATHER_API_KEY
        sync: false
      - key: VITE_APP_NAME
        value: Weather Dashboard
      - key: VITE_ENABLE_PWA
        value: true
      - key: VITE_ENABLE_OFFLINE
        value: true
```

### **Build Process**
1. **Install**: `npm ci` - Clean install of dependencies
2. **Build**: `npm run build` - Create production build
3. **Start**: `npm run preview` - Serve the built application

---

## 🔧 **Environment Variables**

### **Required Variables**
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_WEATHER_API_KEY` | OpenWeatherMap API key | `abc123def456` |

### **Optional Variables**
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_NAME` | Application name | `Weather Dashboard` |
| `VITE_ENABLE_PWA` | Enable PWA features | `true` |
| `VITE_ENABLE_OFFLINE` | Enable offline mode | `true` |
| `NODE_VERSION` | Node.js version | `18` |

---

## 🌐 **Custom Domain (Optional)**

### **Add Custom Domain**
1. Go to your Render service dashboard
2. Click "Settings" tab
3. Scroll to "Custom Domains"
4. Click "Add Custom Domain"
5. Enter your domain (e.g., `weather.yourdomain.com`)
6. Update your DNS records as instructed

### **SSL Certificate**
- Render automatically provides SSL certificates
- Your site will be available via HTTPS
- Certificates auto-renew

---

## 📊 **Render vs Other Platforms**

| Feature | Render | Railway | Vercel |
|---------|--------|---------|---------|
| **Free Tier** | 750 hours/month | $5 credit/month | 100GB bandwidth |
| **Build Time** | Generous limits | Unlimited | 6000 minutes |
| **Cold Starts** | None on free tier | None | Yes on free tier |
| **Custom Domains** | ✅ Free | ✅ Free | ✅ Free |
| **Automatic HTTPS** | ✅ | ✅ | ✅ |
| **Build Reliability** | Excellent | Good | Excellent |

---

## 🔍 **Monitoring & Logs**

### **View Deployment Logs**
1. Go to your Render service dashboard
2. Click "Logs" tab
3. View real-time build and runtime logs

### **Health Checks**
- Render automatically monitors your app
- Health check endpoint: `/` (your app's homepage)
- Automatic restarts if health checks fail

### **Metrics**
- CPU and memory usage
- Request metrics
- Response times
- Available in service dashboard

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Build Fails**
```bash
# Check build logs in Render dashboard
# Common fixes:
1. Verify Node.js version (should be 18+)
2. Check package.json scripts
3. Ensure all dependencies are listed
4. Verify environment variables are set
```

#### **App Won't Start**
```bash
# Check start command
# Ensure preview command works locally:
npm run build
npm run preview
```

#### **Environment Variables Not Working**
```bash
# Verify variables in Render dashboard
# Check variable names match exactly (case-sensitive)
# Redeploy after adding variables
```

#### **API Key Issues**
```bash
# Verify OpenWeatherMap API key is active
# Test API key with curl:
curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY"
```

### **Getting Help**
- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **GitHub Issues**: [Create an issue](https://github.com/ecogetaway/weather-dashboard/issues)

---

## 🚀 **Post-Deployment Checklist**

After successful deployment:

- [ ] Test weather search functionality
- [ ] Verify offline mode works
- [ ] Check mobile responsiveness
- [ ] Test PWA installation
- [ ] Run accessibility audit
- [ ] Check performance metrics
- [ ] Verify all environment variables work
- [ ] Test error handling

---

## 📈 **Performance Optimization**

### **Render-Specific Tips**
- Use Render's CDN for static assets
- Enable gzip compression (automatic)
- Monitor resource usage in dashboard
- Use health checks for reliability

### **Cost Management**
- Free tier: 750 hours/month
- Monitor usage in billing dashboard
- Optimize build times to reduce usage

---

## 🎯 **Next Steps**

1. **Deploy your app** using the steps above
2. **Test thoroughly** with the checklist
3. **Set up monitoring** for production use
4. **Consider upgrading** to paid plan for production apps

---

**🎉 Your Weather Dashboard is now live on Render!**

Share your live URL: `https://weather-dashboard-xyz.onrender.com`

---

*Last Updated: [Current Date]*  
*Render Deployment Guide v1.0*