# 🌤️ Weather Dashboard

A modern, responsive weather application built with React, TypeScript, and modern web technologies. Features offline support, accessibility compliance, and mobile-first design.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/ecogetaway/weather-dashboard)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ecogetaway/weather-dashboard&env=VITE_WEATHER_API_KEY)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/ecogetaway/weather-dashboard)

## 🚀 Live Demo

- **Production**: [https://weather-dashboard-demo.vercel.app](https://weather-dashboard-demo.vercel.app)
- **Staging**: [https://weather-dashboard-staging.netlify.app](https://weather-dashboard-staging.netlify.app)

## ✨ Features

### 🌍 **Weather Data**
- Real-time weather conditions for cities worldwide
- 5-day detailed weather forecasts
- Temperature unit toggle (°C/°F)
- Comprehensive weather metrics (humidity, wind, pressure, UV index)

### 📱 **User Experience**
- Mobile-first responsive design
- Offline functionality with data caching
- Recent searches with persistent storage
- Smart location search with autocomplete
- Touch-friendly interface (44px+ touch targets)

### ♿ **Accessibility**
- WCAG AA compliance
- Full keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Semantic HTML structure

### ⚡ **Performance**
- Progressive Web App (PWA) capabilities
- Service worker for offline caching
- Code splitting and lazy loading
- Core Web Vitals optimization
- Bundle size < 500KB gzipped

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: CSS Modules, Mobile-first design
- **State**: React Hooks, Context API
- **Testing**: Vitest, Testing Library, 95%+ coverage
- **Performance**: Service Worker, Bundle optimization
- **Accessibility**: ARIA labels, Semantic HTML, WCAG AA

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- OpenWeatherMap API key ([Get free key](https://openweathermap.org/api))

### Installation
```bash
# Clone the repository
git clone https://github.com/ecogetaway/weather-dashboard.git
cd weather-dashboard

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your API key to .env.local:
# VITE_WEATHER_API_KEY=your_api_key_here

# Start development server
npm run dev

# Open http://localhost:5173
```

### Build for Production
```bash
npm run build
npm run preview
```

## 📖 Documentation

### 📋 **User Testing**
- **[User Testing Guide](./docs/USER_TESTING_GUIDE.md)** - Comprehensive testing scenarios and instructions
- **[Features Documentation](./docs/FEATURES_DOCUMENTATION.md)** - Detailed feature descriptions and capabilities

### 🚀 **Deployment**
- **[Railway Deployment](./docs/RAILWAY_DEPLOYMENT.md)** - Recommended: Deploy to Railway (generous free tier)
- **[Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)** - All platform deployment instructions
- **[Environment Setup](./docs/DEPLOYMENT_GUIDE.md#environment-variables)** - Configuration and environment variables

### 🧪 **Testing**
- **[Testing Strategy](./docs/USER_TESTING_GUIDE.md#automated-testing)** - Automated and manual testing approaches
- **[Accessibility Testing](./docs/USER_TESTING_GUIDE.md#accessibility-testing)** - WCAG compliance validation

## 🧪 Testing

### Run Tests
```bash
# Unit and integration tests
npm test

# Test coverage report
npm run test:coverage

# Accessibility tests
npm run test:a11y

# Performance tests
npm run lighthouse
```

### Test Coverage
- **Unit Tests**: 95%+ coverage
- **Integration Tests**: All user flows
- **Accessibility**: WCAG AA compliance
- **Performance**: Core Web Vitals monitoring

## 📊 Performance Metrics

- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)
- **First Contentful Paint**: < 1.8s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🌐 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+
- **Mobile**: iOS 14+, Android 90+

## 📱 Mobile Features

- **Responsive Design**: 320px - 1920px+ viewports
- **Touch Optimized**: 44px+ touch targets
- **PWA Support**: Installable as native app
- **Offline First**: Works without internet
- **Performance**: Optimized for mobile networks

## ♿ Accessibility Features

- **Keyboard Navigation**: Full keyboard support
- **Screen Readers**: NVDA, JAWS, VoiceOver compatible
- **Visual**: High contrast, scalable text
- **Motor**: Large touch targets, reduced motion support
- **Cognitive**: Clear navigation, consistent layout

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run test:ui      # Run tests with UI
npm run lint         # Lint code
npm run type-check   # TypeScript type checking
```

### Project Structure
```
src/
├── components/          # React components
├── hooks/              # Custom React hooks
├── services/           # API and data services
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── styles/             # Global styles and breakpoints
└── contexts/           # React contexts

docs/                   # Documentation
├── USER_TESTING_GUIDE.md
├── FEATURES_DOCUMENTATION.md
└── DEPLOYMENT_GUIDE.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Ensure accessibility compliance
- Maintain mobile-first design
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenWeatherMap** - Weather data API
- **React Team** - Amazing framework
- **Vite** - Fast build tool
- **Testing Library** - Testing utilities
- **WCAG** - Accessibility guidelines

## 📞 Support

- **🐛 Bug Reports**: [GitHub Issues](https://github.com/ecogetaway/weather-dashboard/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/ecogetaway/weather-dashboard/discussions)
- **📖 Documentation**: Check the [docs](./docs/) folder
- **❓ Questions**: Create a [discussion](https://github.com/ecogetaway/weather-dashboard/discussions)

## 🎯 Testing Scenarios

### Quick Test Links
- **[Basic Weather Search](./docs/USER_TESTING_GUIDE.md#1-basic-weather-search-flow)** - Test core functionality
- **[Mobile Responsiveness](./docs/USER_TESTING_GUIDE.md#2-mobile-responsiveness-test)** - Test on mobile devices
- **[Offline Functionality](./docs/USER_TESTING_GUIDE.md#3-offline-functionality-test)** - Test offline capabilities
- **[Accessibility](./docs/USER_TESTING_GUIDE.md#4-accessibility-testing)** - Test with assistive technology
- **[Performance](./docs/USER_TESTING_GUIDE.md#5-performance-testing)** - Test loading and runtime performance

### Test Checklist
- [ ] Search for weather in major cities
- [ ] Test on mobile devices (iPhone, Android)
- [ ] Verify offline functionality works
- [ ] Check keyboard navigation
- [ ] Test with screen reader
- [ ] Validate performance metrics

---

**Built with ❤️ for everyone, everywhere** 🌍

*Weather Dashboard - Making weather data accessible to all*