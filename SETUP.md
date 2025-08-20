# Product Manager LS - Setup Guide

## Quick Start

Product Manager LS is a fully offline web application that requires no installation or setup. Simply open the `index.html` file in any modern web browser to get started.

### Option 1: Direct File Access
1. Open `index.html` directly in your web browser
2. The application will work immediately with full offline functionality

### Option 2: Local Web Server (Recommended)
For the best experience, especially for PWA features:

```bash
# Using Python (if available)
python3 -m http.server 8000

# Using Node.js (if available)
npx serve .

# Using PHP (if available)
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Features Available

### Sprint Management
- ✅ Create sprints with 2 or 3-week durations
- ✅ Sprint types: Development, Non-Functional, Release, Hardening
- ✅ Automatic end date calculation
- ✅ Sprint validation and overlap detection
- ✅ Complete CRUD operations

### Calendar Views
- ✅ Sprint calendar showing all days including weekends
- ✅ Daily capacity visualization
- ✅ Sprint boundary highlighting
- ✅ Capacity allocation per day

### Capacity Planning
- ✅ Daily capacity management
- ✅ Capacity utilization tracking
- ✅ Visual capacity indicators (normal/high/over)
- ✅ Working day calculations

### Data Management
- ✅ Complete offline functionality
- ✅ Local storage persistence
- ✅ Data export/import capabilities
- ✅ Automatic backup and recovery
- ✅ Data validation and integrity checks

### Progressive Web App
- ✅ Installable as desktop/mobile app
- ✅ Offline functionality with service worker
- ✅ Responsive mobile-first design
- ✅ App shortcuts and manifest

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires browsers with ES6+ support and Local Storage.

## Data Storage

All data is stored locally in your browser using:
- **Local Storage**: For application data
- **IndexedDB**: For future advanced features
- **Service Worker Cache**: For offline functionality

No data leaves your device - completely private and secure.

## Development

### File Structure
```
/
├── index.html              # Main application
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── src/
│   ├── storage/
│   │   ├── storage.js      # Storage abstraction layer
│   │   └── models.js       # Data models
│   ├── sprints/
│   │   └── sprint-manager.js # Sprint management logic
│   └── app.js              # Main application logic
```

### Technology Stack
- **AlpineJS**: Reactive UI framework
- **TailwindCSS**: Utility-first CSS framework
- **Chart.js**: Data visualization (ready for Sprint 2)
- **Local Storage**: Offline data persistence
- **Service Worker**: Offline functionality

## Next Steps

This Sprint 1 implementation includes:
1. Complete sprint management system
2. Calendar views with capacity planning
3. Offline-first architecture
4. PWA capabilities
5. Data persistence and backup

Ready for Sprint 2 features:
- Work Stream management
- Team Member profiles
- Advanced capacity tracking
- Release planning integration