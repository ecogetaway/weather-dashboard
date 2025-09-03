# Railway Deployment Guide for Weather Dashboard

## 🚂 **Quick Railway Deployment**

Railway is an excellent alternative to Vercel with generous free tier limits and easy deployment.

### **Prerequisites**
- GitHub account
- OpenWeatherMap API key ([Get free key](https://openweathermap.org/api))
- Railway account ([Sign up](https://railway.app))

---

## 🚀 **Method 1: One-Click Deploy (Easiest)**

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

*Note: You'll need to create a Railway template first, or use Method 2 below.*

---

## 🛠️ **Method 2: Deploy from GitHub (Recommended)**

### **Step 1: Prepare Your Repository**
1. Push your code to GitHub
2. Ensure you have the Railway configuration files:
   - `railway.json` ✅ (already created)
   - `nixpacks.toml` ✅ (already created)
   - `.env.example` ✅ (already created)

### **Step 2: Deploy to Railway**

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Click "Login" and sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `weather-dashboard` repository
   - Click "Deploy Now"

3. **Configure Environment Variables**
   - After deployment starts, click on your service
   - Go to "Variables" tab
   - Add these variables:

   ```bash
   VITE_WEATHER_API_KEY=your_openweathermap_api_key_here
   VITE_APP_NAME=Weather Dashboard
   VITE_ENABLE_PWA=true
   VITE_ENABLE_OFFLINE=true
   ```

4. **Get Your Live URL**
   - Go to "Settings" tab
   - Click "Generate Domain" 
   - Your app will be available at: `https://your-app-name.up.railway.app`

---

## 🖥️ **Method 3: Deploy via CLI**

### **Install Railway CLI**
```bash
# macOS (using Homebrew)
brew install railway

# Or using npm
npm install -g @railway/cli

# Or using curl
curl -fsSL https://railway.app/install.sh | sh
```

### **Deploy Steps**
```bash
# Login to Railway
railway login

# Initialize Railway in your project
railway init

# Set environment variables
railway variables set VITE_WEATHER_API_KEY=your_api_key_here
railway variables set VITE_APP_NAME="Weather Dashboard"
railway variables set VITE_ENABLE_PWA=true
railway variables set VITE_ENABLE_OFFLINE=true

# Deploy
railway up
```

---

## ⚙️ **Configuration Files Explained**

### **railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run preview",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### **nixpacks.toml**
```toml
[phases.setup]
nixPkgs = ['nodejs-18_x', 'npm-9_x']

[phases.install]
cmds = ['npm ci']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'npm run preview'
```

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
| `VITE_ENABLE_ANALYTICS` | Enable analytics | `false` |

---

## 🌐 **Custom Domain (Optional)**

### **Add Custom Domain**
1. Go to your Railway project dashboard
2. Click "Settings" tab
3. Scroll to "Domains" section
4. Click "Custom Domain"
5. Enter your domain (e.g., `weather.yourdomain.com`)
6. Update your DNS records as instructed

### **SSL Certificate**
- Railway automatically provides SSL certificates
- Your site will be available via HTTPS

---

## 📊 **Railway vs Other Platforms**

| Feature | Railway | Vercel | Netlify |
|---------|---------|---------|---------|
| **Free Tier** | $5 credit/month | 100GB bandwidth | 100GB bandwidth |
| **Build Time** | Unlimited | 6000 minutes | 300 minutes |
| **Deployments** | Unlimited | Unlimited | Unlimited |
| **Custom Domains** | ✅ | ✅ | ✅ |
| **Environment Variables** | ✅ | ✅ | ✅ |
| **Automatic HTTPS** | ✅ | ✅ | ✅ |
| **Git Integration** | ✅ | ✅ | ✅ |

---

## 🔍 **Monitoring & Logs**

### **View Deployment Logs**
1. Go to your Railway project
2. Click on your service
3. Go to "Deployments" tab
4. Click on any deployment to view logs

### **View Runtime Logs**
1. In your service dashboard
2. Go to "Logs" tab
3. View real-time application logs

### **Metrics**
- Railway provides basic metrics
- CPU usage, memory usage, network traffic
- Available in the "Metrics" tab

---

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Build Fails**
```bash
# Check your build logs in Railway dashboard
# Common fixes:
1. Ensure Node.js version compatibility (18+)
2. Check package.json scripts
3. Verify environment variables are set
```

#### **App Won't Start**
```bash
# Check start command in railway.json
# Ensure preview command works locally:
npm run build
npm run preview
```

#### **Environment Variables Not Working**
```bash
# Verify variables are set in Railway dashboard
# Check variable names match exactly (case-sensitive)
# Restart deployment after adding variables
```

#### **API Key Issues**
```bash
# Verify OpenWeatherMap API key is active
# Test API key with curl:
curl "https://api.openweathermap.org/data/2.5/weather?q=London&appid=YOUR_API_KEY"
```

### **Getting Help**
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **Railway Discord**: [discord.gg/railway](https://discord.gg/railway)
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
- [ ] Test error handling (invalid searches, network issues)

---

## 📈 **Scaling & Optimization**

### **Performance Tips**
- Railway automatically handles scaling
- Monitor usage in Railway dashboard
- Optimize bundle size if needed
- Use Railway's CDN for static assets

### **Cost Management**
- Railway free tier includes $5/month credit
- Monitor usage in billing dashboard
- Optimize resource usage to stay within limits

---

**🎉 Your Weather Dashboard is now live on Railway!**

Share your live URL: `https://your-app-name.up.railway.app`

---

*Last Updated: [Current Date]*  
*Railway Deployment Guide v1.0*