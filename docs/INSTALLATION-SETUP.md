# Product Manager LS - Installation & Setup Guide

## Overview

Product Manager LS is a browser-based Progressive Web App (PWA) that requires no traditional installation process. This guide covers deployment options, browser setup, PWA installation, and configuration for optimal performance.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Deployment Options](#deployment-options)
3. [Browser Requirements](#browser-requirements)
4. [PWA Installation](#pwa-installation)
5. [Local Development](#local-development)
6. [Network Configuration](#network-configuration)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting Setup](#troubleshooting-setup)

## Quick Start

### Option 1: Direct File Access

1. **Download**: Get the application files
2. **Open**: Double-click `index.html` to open in your default browser
3. **Start Using**: Begin creating sprints and managing your team

### Option 2: Local Web Server

1. **Choose a Server Method**:
   ```bash
   # Python (recommended)
   python -m http.server 8000
   
   # Node.js
   npx serve .
   
   # PHP
   php -S localhost:8000
   ```

2. **Access**: Open `http://localhost:8000` in your browser

3. **Install as PWA**: Use browser's "Install App" option

## Deployment Options

### 1. Static File Hosting

#### GitHub Pages

1. **Create Repository**: Upload files to GitHub repository
2. **Enable Pages**: Go to Settings > Pages
3. **Select Source**: Choose main branch
4. **Access**: Use provided GitHub Pages URL

```yaml
# .github/workflows/deploy.yml (optional CI/CD)
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

#### Netlify

1. **Drag and Drop**: Upload files to Netlify
2. **Custom Domain**: Configure custom domain (optional)
3. **HTTPS**: Automatic SSL certificate

#### Vercel

1. **Connect Repository**: Link GitHub repository
2. **Auto Deploy**: Automatic deployment on commits
3. **Edge Network**: Global CDN distribution

### 2. Self-Hosted Solutions

#### Apache Configuration

```apache
# .htaccess
<IfModule mod_rewrite.c>
    RewriteEngine On
    
    # Handle service worker
    <Files "sw.js">
        Header set Cache-Control "no-cache"
    </Files>
    
    # Handle manifest.json
    <Files "manifest.json">
        Header set Content-Type "application/manifest+json"
    </Files>
    
    # Security headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options SAMEORIGIN
    Header always set X-XSS-Protection "1; mode=block"
</IfModule>
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/product-manager-ls;
    index index.html;
    
    # Handle service worker
    location /sw.js {
        add_header Cache-Control "no-cache";
        expires off;
    }
    
    # Handle manifest
    location /manifest.json {
        add_header Content-Type "application/manifest+json";
    }
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    
    # Handle SPA routing (if needed)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 3. Cloud Platforms

#### AWS S3 + CloudFront

1. **S3 Bucket**: Create and configure for static hosting
2. **CloudFront**: Set up distribution for global delivery
3. **Route 53**: Configure custom domain (optional)

#### Azure Static Web Apps

1. **Create Resource**: Set up Static Web App
2. **Connect Repository**: Link to source control
3. **Automatic Deployment**: CI/CD pipeline included

#### Google Cloud Storage

1. **Create Bucket**: Configure for web hosting
2. **Cloud CDN**: Add for performance
3. **Custom Domain**: Configure DNS

## Browser Requirements

### Minimum Requirements

| Browser | Minimum Version | Recommended Version |
|---------|----------------|--------------------|
| Chrome | 90 | Latest |
| Firefox | 88 | Latest |
| Safari | 14 | Latest |
| Edge | 90 | Latest |

### Required Features

- **JavaScript ES6+**: Arrow functions, classes, modules
- **Local Storage**: 5MB+ available storage
- **Service Workers**: For offline functionality
- **CSS Grid/Flexbox**: For responsive layout
- **Fetch API**: For potential future enhancements

### Browser Configuration

#### Enable Required Features

1. **JavaScript**: Ensure JavaScript is enabled
2. **Local Storage**: Check storage settings
3. **Service Workers**: Usually enabled by default
4. **Third-party Cookies**: Not required (local-only app)

#### Chrome Setup

```javascript
// Check Chrome features in DevTools Console
console.log('Local Storage:', typeof(Storage) !== "undefined");
console.log('Service Worker:', 'serviceWorker' in navigator);
console.log('ES6 Support:', typeof Symbol !== "undefined");
```

#### Firefox Setup

1. **about:config**: Advanced configuration (if needed)
2. **dom.storage.enabled**: Should be `true`
3. **dom.serviceWorkers.enabled**: Should be `true`

#### Safari Setup

1. **Develop Menu**: Enable for debugging
2. **Local Storage**: Check in Storage settings
3. **Service Workers**: Available in Safari 11.1+

## PWA Installation

### Desktop Installation

#### Chrome/Edge

1. **Visit Application**: Open in browser
2. **Install Prompt**: Look for install icon in address bar
3. **Click Install**: Follow installation prompts
4. **Desktop Shortcut**: App appears in applications folder

#### Firefox

1. **Menu**: Click three-line menu button
2. **Install**: Look for "Install" option
3. **Confirm**: Complete installation process

#### Safari

1. **Share Menu**: Click share button
2. **Add to Dock**: Select "Add to Dock"
3. **Desktop App**: Launches as standalone app

### Mobile Installation

#### iOS (Safari)

1. **Open in Safari**: Navigate to application
2. **Share Button**: Tap share icon at bottom
3. **Add to Home Screen**: Select from menu
4. **Name App**: Customize app name
5. **Add**: Tap "Add" to confirm

#### Android (Chrome)

1. **Open in Chrome**: Navigate to application
2. **Menu**: Tap three-dot menu
3. **Install App**: Select "Install app"
4. **Add to Home Screen**: Confirm installation

### PWA Features After Installation

- **Standalone Window**: Runs without browser UI
- **App Icon**: Appears in system applications
- **Offline Access**: Works without internet
- **Fast Launch**: Quick startup time
- **Background Sync**: Ready for future features

## Local Development

### Development Environment Setup

#### Prerequisites

- Text editor or IDE (VS Code recommended)
- Modern browser with DevTools
- Local web server (optional but recommended)

#### Recommended Tools

- **VS Code Extensions**:
  - Live Server
  - JavaScript (ES6) code snippets
  - HTML CSS Support
  - AlpineJS IntelliSense
  - TailwindCSS IntelliSense

#### Development Server Options

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (with serve)
npm install -g serve
serve -s . -l 8000

# Node.js (with http-server)
npm install -g http-server
http-server -p 8000

# PHP
php -S localhost:8000

# VS Code Live Server
# Install extension and right-click index.html
```

### Development Configuration

#### HTTPS for Testing (Optional)

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Start HTTPS server
python -m http.server 8000 --bind localhost --directory . \
  --keyfile key.pem --certfile cert.pem
```

#### Service Worker Development

```javascript
// Disable service worker caching during development
if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
    navigator.serviceWorker.register('/sw.js');
}
```

### File Structure

```
product-manager-ls/
├── index.html              # Main application entry
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── src/
│   ├── app.js             # Main application logic
│   ├── storage/
│   │   ├── storage.js     # Storage manager
│   │   └── models.js      # Data models
│   ├── sprints/
│   │   └── sprint-manager.js
│   ├── workstreams/
│   │   └── workstream-manager.js
│   └── team/
│       ├── team-manager.js
│       └── capacity-tracker.js
├── docs/                   # Documentation
└── README.md              # Project readme
```

## Network Configuration

### Firewall Settings

No special firewall configuration required for local file access. For web server deployment:

- **Port 80**: HTTP traffic
- **Port 443**: HTTPS traffic
- **Custom Ports**: As configured (e.g., 8000)

### CORS Configuration

Not required for local file access. For cross-origin scenarios:

```javascript
// Express.js example
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});
```

### Content Security Policy

```html
<!-- Recommended CSP header -->
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' cdn.tailwindcss.com cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline' cdn.tailwindcss.com;
    connect-src 'self';
    img-src 'self' data:;
    font-src 'self';
">
```

## Performance Optimization

### Browser Optimization

#### Chrome Performance

1. **Memory Usage**: Monitor in Task Manager
2. **DevTools**: Use Performance tab for profiling
3. **Extensions**: Disable unnecessary extensions
4. **Cache**: Clear cache if experiencing issues

#### Storage Optimization

```javascript
// Monitor storage usage
function checkStorageUsage() {
    const used = JSON.stringify(localStorage).length;
    const available = 5 * 1024 * 1024; // 5MB typical limit
    const percentage = (used / available) * 100;
    
    console.log(`Storage used: ${used} bytes (${percentage.toFixed(1)}%)`);
    
    if (percentage > 80) {
        console.warn('Storage usage high - consider exporting data');
    }
}
```

### Network Optimization

#### CDN Configuration

```html
<!-- Use CDN for faster loading -->
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
```

#### Compression

```apache
# Apache gzip compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### Caching Strategy

```javascript
// Service worker caching
const CACHE_NAME = 'product-manager-ls-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/src/app.js',
    '/src/storage/storage.js',
    '/src/storage/models.js',
    // Add other critical files
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});
```

## Troubleshooting Setup

### Common Installation Issues

#### Issue: Application Won't Load

**Symptoms**: Blank page or loading errors

**Solutions**:
1. Check JavaScript console for errors
2. Verify all files are present
3. Ensure JavaScript is enabled
4. Try different browser
5. Clear browser cache

#### Issue: Local Storage Not Working

**Symptoms**: Data doesn't persist between sessions

**Solutions**:
1. Check browser storage settings
2. Ensure not in private/incognito mode
3. Verify storage quota
4. Check for browser extensions interference

#### Issue: PWA Installation Fails

**Symptoms**: No install prompt appears

**Solutions**:
1. Verify HTTPS (required for PWA)
2. Check manifest.json validity
3. Ensure service worker is registered
4. Try manual installation from browser menu

#### Issue: Service Worker Errors

**Symptoms**: Offline functionality not working

**Solutions**:
1. Check service worker registration in DevTools
2. Verify HTTPS requirement
3. Clear service worker cache
4. Check browser compatibility

### Browser-Specific Issues

#### Safari Issues

- **Local Storage Limits**: More restrictive than other browsers
- **Service Worker Support**: Requires Safari 11.1+
- **PWA Installation**: Different process than Chrome/Firefox

#### Firefox Issues

- **Service Worker**: Check `dom.serviceWorkers.enabled`
- **Local Storage**: Verify `dom.storage.enabled`
- **Private Browsing**: Features may be limited

#### Mobile Browser Issues

- **Storage Quotas**: More restrictive on mobile
- **Background Processing**: Limited service worker capabilities
- **Installation**: Platform-specific differences

### Performance Issues

#### Slow Loading

**Causes**:
- Large datasets in localStorage
- Network latency for CDN resources
- Browser extensions
- Insufficient system memory

**Solutions**:
- Export and reimport data to optimize storage
- Use local CDN or cache resources
- Disable problematic extensions
- Close unnecessary browser tabs

#### Memory Usage

**Monitoring**:
```javascript
// Check memory usage (Chrome only)
if ('memory' in performance) {
    console.log('Memory usage:', performance.memory);
}

// Monitor localStorage size
const storageSize = new Blob(Object.values(localStorage)).size;
console.log('LocalStorage size:', storageSize, 'bytes');
```

### Diagnostic Tools

#### Browser DevTools

1. **Application Tab**: Check localStorage, service workers
2. **Network Tab**: Monitor resource loading
3. **Console Tab**: Check for JavaScript errors
4. **Performance Tab**: Profile application performance

#### Validation Tools

```javascript
// Basic feature detection
function validateBrowserSupport() {
    const features = {
        localStorage: typeof(Storage) !== "undefined",
        serviceWorker: 'serviceWorker' in navigator,
        es6: typeof Symbol !== "undefined",
        fetch: typeof fetch !== "undefined",
        cssGrid: CSS.supports('display', 'grid')
    };
    
    console.table(features);
    
    const unsupported = Object.entries(features)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
    
    if (unsupported.length > 0) {
        console.warn('Unsupported features:', unsupported);
    }
    
    return unsupported.length === 0;
}

// Run validation
validateBrowserSupport();
```

### Support Resources

#### Documentation

- Browser compatibility tables
- PWA installation guides
- Service worker debugging
- Local storage best practices

#### Testing

- Cross-browser testing
- Mobile device testing
- Offline functionality testing
- Performance benchmarking

---

This installation and setup guide provides comprehensive coverage for deploying and configuring Product Manager LS across different environments and platforms. Follow the appropriate sections based on your deployment needs and technical requirements.