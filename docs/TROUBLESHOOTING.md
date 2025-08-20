# Product Manager LS - Troubleshooting Guide

## Overview

This comprehensive troubleshooting guide covers common issues, diagnostic procedures, and solutions for Product Manager LS. The guide is organized by problem category with step-by-step resolution procedures.

## Table of Contents

1. [Data and Storage Issues](#data-and-storage-issues)
2. [Performance Problems](#performance-problems)
3. [Offline Functionality Issues](#offline-functionality-issues)
4. [User Interface Problems](#user-interface-problems)
5. [Browser Compatibility Issues](#browser-compatibility-issues)
6. [Sprint Management Issues](#sprint-management-issues)
7. [Team Management Issues](#team-management-issues)
8. [Work Stream Issues](#work-stream-issues)
9. [Import/Export Problems](#importexport-problems)
10. [Diagnostic Tools](#diagnostic-tools)
11. [Recovery Procedures](#recovery-procedures)

## Data and Storage Issues

### Data Not Persisting

**Problem**: Changes are lost when refreshing the browser or reopening the application.

**Symptoms**:
- Sprints, team members, or work streams disappear after browser refresh
- "Failed to save" error messages
- Application appears to work but data doesn't persist

**Diagnostic Steps**:
1. Open browser Developer Tools (F12)
2. Go to Application/Storage tab
3. Check Local Storage section
4. Look for application data under your domain

**Solutions**:

#### Check Local Storage Availability
```javascript
// Run in browser console
if (typeof(Storage) !== "undefined") {
    console.log("Local Storage is supported");
    console.log("Current usage:", JSON.stringify(localStorage).length, "bytes");
} else {
    console.log("Local Storage is not supported");
}
```

#### Enable Local Storage
1. **Chrome/Edge**: Settings > Privacy and Security > Site Settings > Cookies and site data > Allow all cookies
2. **Firefox**: Preferences > Privacy & Security > Cookies and Site Data > Accept cookies and site data from websites
3. **Safari**: Preferences > Privacy > Cookies and website data > Allow from websites I visit

#### Clear and Reset Storage
```javascript
// Clear all application data (WARNING: This will delete all data)
localStorage.clear();
location.reload();
```

#### Check Available Storage Space
```javascript
// Estimate storage usage
function checkStorageQuota() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
        navigator.storage.estimate().then(quota => {
            console.log('Storage quota:', quota);
            const usagePercentage = (quota.usage / quota.quota) * 100;
            console.log('Usage:', usagePercentage.toFixed(2) + '%');
        });
    } else {
        // Fallback estimation
        const used = JSON.stringify(localStorage).length;
        const estimated = 5 * 1024 * 1024; // 5MB typical limit
        console.log('Estimated usage:', ((used / estimated) * 100).toFixed(2) + '%');
    }
}
checkStorageQuota();
```

### Storage Quota Exceeded

**Problem**: "Storage quota exceeded" errors when saving data.

**Symptoms**:
- Error messages about storage limits
- Unable to create new sprints or team members
- Application becomes unresponsive

**Solutions**:

#### Export Data Before Cleanup
1. Click "Export Data" button immediately
2. Save the JSON file as backup
3. Proceed with cleanup

#### Remove Unnecessary Data
```javascript
// Check storage usage by category
function analyzeStorageUsage() {
    const data = {
        sprints: JSON.parse(localStorage.getItem('sprints') || '[]'),
        workStreams: JSON.parse(localStorage.getItem('workStreams') || '[]'),
        teamMembers: JSON.parse(localStorage.getItem('teamMembers') || '[]')
    };
    
    Object.entries(data).forEach(([key, value]) => {
        const size = JSON.stringify(value).length;
        console.log(`${key}: ${size} bytes (${value.length} items)`);
    });
}
analyzeStorageUsage();
```

#### Clean Up Old Data
1. Delete completed sprints from several months ago
2. Remove inactive team members
3. Deactivate unused work streams
4. Export and reimport to optimize storage

### Data Corruption

**Problem**: Application shows errors or behaves unexpectedly due to corrupted data.

**Symptoms**:
- JavaScript errors in console
- Missing or malformed data
- Application crashes on certain actions

**Diagnostic Steps**:
```javascript
// Validate data integrity
function validateStorageData() {
    try {
        const sprints = JSON.parse(localStorage.getItem('sprints') || '[]');
        const workStreams = JSON.parse(localStorage.getItem('workStreams') || '[]');
        const teamMembers = JSON.parse(localStorage.getItem('teamMembers') || '[]');
        
        console.log('Data validation:');
        console.log('Sprints:', Array.isArray(sprints), sprints.length);
        console.log('Work Streams:', Array.isArray(workStreams), workStreams.length);
        console.log('Team Members:', Array.isArray(teamMembers), teamMembers.length);
        
        // Check for required fields
        sprints.forEach((sprint, index) => {
            if (!sprint.id || !sprint.name) {
                console.error(`Invalid sprint at index ${index}:`, sprint);
            }
        });
        
        return true;
    } catch (error) {
        console.error('Data validation failed:', error);
        return false;
    }
}
validateStorageData();
```

**Recovery Solutions**:

#### Restore from Backup
1. Use previously exported JSON file
2. Clear current storage
3. Import backup data

#### Reset Specific Data Category
```javascript
// Reset only sprints (example)
localStorage.removeItem('sprints');
location.reload();
```

#### Complete Reset
```javascript
// Nuclear option: clear everything
Object.keys(localStorage).forEach(key => {
    if (key.includes('product-manager') || 
        ['sprints', 'workStreams', 'teamMembers'].includes(key)) {
        localStorage.removeItem(key);
    }
});
location.reload();
```

## Performance Problems

### Slow Application Loading

**Problem**: Application takes a long time to load or becomes unresponsive.

**Symptoms**:
- Blank screen for extended periods
- Slow response to user interactions
- Browser becomes sluggish

**Diagnostic Steps**:
1. Open Developer Tools
2. Go to Network tab
3. Refresh page and observe load times
4. Check Console tab for errors

**Solutions**:

#### Check Network Resources
```javascript
// Monitor CDN resource loading
function checkResourceLoading() {
    const scripts = document.querySelectorAll('script[src]');
    const links = document.querySelectorAll('link[href]');
    
    console.log('External resources:');
    scripts.forEach(script => {
        console.log('Script:', script.src, script.loaded ? 'loaded' : 'loading');
    });
    
    links.forEach(link => {
        console.log('Link:', link.href, link.loaded ? 'loaded' : 'loading');
    });
}
checkResourceLoading();
```

#### Optimize Local Storage
```javascript
// Compress storage data
function optimizeStorage() {
    const data = {
        sprints: JSON.parse(localStorage.getItem('sprints') || '[]'),
        workStreams: JSON.parse(localStorage.getItem('workStreams') || '[]'),
        teamMembers: JSON.parse(localStorage.getItem('teamMembers') || '[]')
    };
    
    // Remove unnecessary properties and optimize
    Object.keys(data).forEach(key => {
        const optimized = data[key].map(item => {
            // Remove empty arrays and null values
            const cleaned = {};
            Object.entries(item).forEach(([prop, value]) => {
                if (value !== null && value !== undefined && 
                    !(Array.isArray(value) && value.length === 0)) {
                    cleaned[prop] = value;
                }
            });
            return cleaned;
        });
        
        localStorage.setItem(key, JSON.stringify(optimized));
    });
    
    console.log('Storage optimized');
}
```

#### Clear Browser Cache
1. **Chrome**: Settings > Privacy and Security > Clear browsing data
2. **Firefox**: Preferences > Privacy & Security > Clear Data
3. **Safari**: Develop > Empty Caches
4. **Edge**: Settings > Privacy, search, and services > Clear browsing data

### Memory Usage Issues

**Problem**: High memory consumption leading to browser slowdown.

**Symptoms**:
- Browser tab becomes unresponsive
- System memory warnings
- Other applications become slow

**Monitoring Memory Usage**:
```javascript
// Monitor memory usage (Chrome only)
function monitorMemory() {
    if ('memory' in performance) {
        const memory = performance.memory;
        console.log('Memory usage:', {
            used: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
            total: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
            limit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
        });
    }
    
    // Monitor localStorage size
    const storageSize = new Blob(Object.values(localStorage)).size;
    console.log('LocalStorage size:', (storageSize / 1024).toFixed(2) + ' KB');
}

// Run periodically
setInterval(monitorMemory, 10000);
```

**Solutions**:
1. Close unnecessary browser tabs
2. Restart browser
3. Reduce data set size
4. Use browser's task manager to identify memory-heavy processes

## Offline Functionality Issues

### Service Worker Problems

**Problem**: Application doesn't work offline or shows connection errors.

**Symptoms**:
- "No internet connection" messages when offline
- Application won't load without internet
- Service worker registration failures

**Diagnostic Steps**:
```javascript
// Check service worker status
function checkServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            console.log('Service worker registrations:', registrations.length);
            registrations.forEach((registration, index) => {
                console.log(`SW ${index}:`, {
                    scope: registration.scope,
                    active: !!registration.active,
                    installing: !!registration.installing,
                    waiting: !!registration.waiting
                });
            });
        });
    } else {
        console.log('Service workers not supported');
    }
}
checkServiceWorker();
```

**Solutions**:

#### Unregister and Re-register Service Worker
```javascript
// Unregister all service workers
navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
        registration.unregister().then(success => {
            console.log('Unregistered:', success);
        });
    });
    
    // Reload to re-register
    setTimeout(() => location.reload(), 1000);
});
```

#### Check HTTPS Requirement
- Service workers require HTTPS (except localhost)
- Ensure application is served over HTTPS in production
- Use `http://localhost` for local development

#### Clear Service Worker Cache
1. Open Developer Tools
2. Go to Application tab
3. Select Service Workers
4. Click "Unregister" next to your service worker
5. Refresh the page

### PWA Installation Issues

**Problem**: Application cannot be installed as PWA.

**Symptoms**:
- No "Install App" prompt
- Install option missing from browser menu
- Installation fails with errors

**Diagnostic Steps**:
```javascript
// Validate PWA requirements
function validatePWA() {
    const checks = {
        manifest: !!document.querySelector('link[rel="manifest"]'),
        serviceWorker: 'serviceWorker' in navigator,
        https: location.protocol === 'https:' || location.hostname === 'localhost',
        icons: true // Check manifest for icons
    };
    
    // Check manifest details
    fetch('/manifest.json')
        .then(response => response.json())
        .then(manifest => {
            checks.manifestValid = !!(manifest.name && manifest.short_name);
            checks.icons = !!(manifest.icons && manifest.icons.length > 0);
            checks.startUrl = !!manifest.start_url;
            
            console.table(checks);
        })
        .catch(error => {
            checks.manifestValid = false;
            console.error('Manifest validation failed:', error);
            console.table(checks);
        });
}
validatePWA();
```

**Solutions**:
1. Ensure HTTPS (required for PWA)
2. Verify manifest.json is accessible
3. Check service worker registration
4. Validate icon requirements
5. Try manual installation from browser menu

## User Interface Problems

### Layout Issues

**Problem**: Interface elements are misaligned or not displaying correctly.

**Symptoms**:
- Overlapping elements
- Missing buttons or content
- Responsive design not working
- Modal dialogs not appearing

**Diagnostic Steps**:
1. Check browser zoom level (should be 100%)
2. Verify screen resolution and browser window size
3. Test on different devices/browsers
4. Check Developer Tools for CSS errors

**Solutions**:

#### Reset Browser Zoom
- **Chrome/Edge**: Ctrl+0 (Windows) or Cmd+0 (Mac)
- **Firefox**: Ctrl+0 (Windows) or Cmd+0 (Mac)
- **Safari**: Cmd+0

#### Check CSS Loading
```javascript
// Verify TailwindCSS is loaded
function checkCSS() {
    const testElement = document.createElement('div');
    testElement.className = 'flex';
    document.body.appendChild(testElement);
    
    const computedStyle = window.getComputedStyle(testElement);
    const isFlexLoaded = computedStyle.display === 'flex';
    
    document.body.removeChild(testElement);
    
    console.log('TailwindCSS loaded:', isFlexLoaded);
    
    if (!isFlexLoaded) {
        console.error('TailwindCSS may not be loaded properly');
    }
}
checkCSS();
```

#### Force CSS Reload
```javascript
// Reload CSS resources
function reloadCSS() {
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
        const newLink = link.cloneNode();
        newLink.href = link.href + '?refresh=' + Date.now();
        link.parentNode.replaceChild(newLink, link);
    });
}
reloadCSS();
```

### Interactive Elements Not Working

**Problem**: Buttons, forms, or other interactive elements don't respond.

**Symptoms**:
- Clicking buttons has no effect
- Form inputs don't accept data
- Modal dialogs won't open/close
- Dropdown menus don't work

**Diagnostic Steps**:
```javascript
// Check AlpineJS initialization
function checkAlpineJS() {
    console.log('Alpine.js loaded:', typeof Alpine !== 'undefined');
    console.log('Alpine components:', document.querySelectorAll('[x-data]').length);
    
    // Test AlpineJS reactivity
    const testComponent = document.querySelector('[x-data]');
    if (testComponent) {
        console.log('First component data:', testComponent._x_dataStack);
    }
}
checkAlpineJS();
```

**Solutions**:

#### Check JavaScript Errors
1. Open Developer Tools Console
2. Look for red error messages
3. Fix any JavaScript errors
4. Refresh the page

#### Verify AlpineJS Loading
```javascript
// Force AlpineJS restart
if (typeof Alpine !== 'undefined') {
    Alpine.start();
    console.log('Alpine.js restarted');
} else {
    console.error('Alpine.js not loaded');
}
```

#### Disable Browser Extensions
1. Try loading in incognito/private mode
2. Disable ad blockers temporarily
3. Check for JavaScript-blocking extensions

## Browser Compatibility Issues

### Unsupported Browser Features

**Problem**: Application doesn't work in older browsers.

**Symptoms**:
- Blank page or loading errors
- JavaScript errors about unsupported features
- CSS not rendering correctly

**Feature Detection**:
```javascript
// Comprehensive browser feature check
function checkBrowserSupport() {
    const features = {
        localStorage: typeof(Storage) !== "undefined",
        serviceWorker: 'serviceWorker' in navigator,
        es6Classes: typeof class{} === 'function',
        arrowFunctions: (() => true)() === true,
        fetch: typeof fetch !== "undefined",
        promises: typeof Promise !== "undefined",
        cssGrid: CSS.supports('display', 'grid'),
        cssFlexbox: CSS.supports('display', 'flex'),
        customElements: 'customElements' in window,
        modules: 'noModule' in HTMLScriptElement.prototype
    };
    
    console.table(features);
    
    const unsupported = Object.entries(features)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
    
    if (unsupported.length > 0) {
        console.warn('Unsupported features:', unsupported);
        return false;
    }
    
    return true;
}

const isSupported = checkBrowserSupport();
if (!isSupported) {
    alert('Your browser may not support all features. Please update to a modern browser.');
}
```

**Solutions**:
1. Update to a modern browser version
2. Use alternative browser (Chrome, Firefox, Safari, Edge)
3. Enable JavaScript if disabled
4. Check for browser-specific issues

### Mobile Browser Issues

**Problem**: Application doesn't work properly on mobile devices.

**Symptoms**:
- Touch interactions not working
- Layout issues on small screens
- Performance problems on mobile

**Mobile-Specific Checks**:
```javascript
// Detect mobile environment
function checkMobileSupport() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window;
    const viewport = document.querySelector('meta[name="viewport"]');
    
    console.log('Mobile detection:', {
        isMobile,
        isTouch,
        hasViewport: !!viewport,
        screenSize: `${screen.width}x${screen.height}`,
        windowSize: `${window.innerWidth}x${window.innerHeight}`
    });
}
checkMobileSupport();
```

**Solutions**:
1. Ensure viewport meta tag is present
2. Test touch interactions
3. Check responsive design
4. Optimize for mobile performance

## Sprint Management Issues

### Cannot Create Sprints

**Problem**: Sprint creation fails or produces errors.

**Symptoms**:
- "Create Sprint" button doesn't work
- Form validation errors
- Sprint not appearing after creation

**Diagnostic Steps**:
```javascript
// Test sprint creation manually
function testSprintCreation() {
    const testSprint = {
        name: 'Test Sprint',
        startDate: '2024-01-01',
        duration: 2,
        type: 'Development'
    };
    
    if (typeof window.sprintManager !== 'undefined') {
        const result = window.sprintManager.createSprint(testSprint);
        console.log('Sprint creation test:', result);
    } else {
        console.error('SprintManager not available');
    }
}
testSprintCreation();
```

**Solutions**:
1. Check form validation messages
2. Ensure all required fields are filled
3. Verify date format (YYYY-MM-DD)
4. Check for JavaScript errors in console

### Sprint Calendar Not Loading

**Problem**: Calendar view shows empty or doesn't load sprint data.

**Symptoms**:
- Empty calendar grid
- "No calendar data available" message
- Incorrect date ranges

**Diagnostic Steps**:
```javascript
// Debug calendar generation
function debugCalendar(sprintId) {
    if (typeof window.sprintManager !== 'undefined') {
        const sprint = window.sprintManager.getSprintById(sprintId);
        if (sprint) {
            console.log('Sprint data:', sprint);
            const calendar = window.sprintManager.getSprintCalendar(sprintId);
            console.log('Calendar data:', calendar);
        } else {
            console.error('Sprint not found:', sprintId);
        }
    }
}

// Get first sprint ID and test
const sprints = JSON.parse(localStorage.getItem('sprints') || '[]');
if (sprints.length > 0) {
    debugCalendar(sprints[0].id);
}
```

**Solutions**:
1. Verify sprint has valid start and end dates
2. Check sprint selection in calendar dropdown
3. Refresh the page and try again
4. Clear and recreate the sprint if corrupted

## Team Management Issues

### Team Members Not Saving

**Problem**: Team member creation or updates fail.

**Symptoms**:
- Team member form doesn't submit
- Members disappear after page refresh
- Validation errors on valid data

**Diagnostic Steps**:
```javascript
// Test team member creation
function testTeamMemberCreation() {
    const testMember = {
        name: 'Test User',
        email: 'test@example.com',
        role: 'Developer',
        defaultCapacity: 8
    };
    
    if (typeof window.teamManager !== 'undefined') {
        const result = window.teamManager.createTeamMember(testMember);
        console.log('Team member creation test:', result);
    } else {
        console.error('TeamManager not available');
    }
}
testTeamMemberCreation();
```

**Solutions**:
1. Verify all required fields are filled
2. Check email format validation
3. Ensure capacity is a valid number
4. Check for duplicate names

### Capacity Calculations Wrong

**Problem**: Team capacity calculations show incorrect values.

**Symptoms**:
- Negative capacity values
- Capacity bars showing wrong percentages
- Time off not reflected in calculations

**Diagnostic Steps**:
```javascript
// Debug capacity calculations
function debugCapacity() {
    const sprints = JSON.parse(localStorage.getItem('sprints') || '[]');
    const teamMembers = JSON.parse(localStorage.getItem('teamMembers') || '[]');
    
    console.log('Team members:', teamMembers.length);
    
    sprints.forEach(sprint => {
        if (typeof window.capacityTracker !== 'undefined') {
            const capacity = window.capacityTracker.calculateTeamCapacity(sprint.id);
            console.log(`Sprint ${sprint.name} capacity:`, capacity);
        }
    });
}
debugCapacity();
```

**Solutions**:
1. Verify team member assignments to sprints
2. Check time off date ranges
3. Ensure default capacity values are reasonable
4. Review sprint duration and dates

## Work Stream Issues

### Color Selection Problems

**Problem**: Work stream colors not saving or displaying incorrectly.

**Symptoms**:
- Colors revert to default
- Color picker not working
- Duplicate colors allowed

**Diagnostic Steps**:
```javascript
// Check work stream colors
function debugWorkStreamColors() {
    const workStreams = JSON.parse(localStorage.getItem('workStreams') || '[]');
    const colors = workStreams.map(ws => ({ name: ws.name, color: ws.color }));
    
    console.table(colors);
    
    // Check for duplicates
    const colorCounts = {};
    workStreams.forEach(ws => {
        colorCounts[ws.color] = (colorCounts[ws.color] || 0) + 1;
    });
    
    const duplicates = Object.entries(colorCounts)
        .filter(([color, count]) => count > 1);
    
    if (duplicates.length > 0) {
        console.warn('Duplicate colors:', duplicates);
    }
}
debugWorkStreamColors();
```

**Solutions**:
1. Select different color from palette
2. Verify color code format (#RRGGBB)
3. Check for color conflicts
4. Clear and recreate work stream if corrupted

### Work Stream Associations

**Problem**: Work streams not properly associated with sprints.

**Symptoms**:
- Work stream tags missing from sprint cards
- Incorrect association counts
- Broken relationships after edits

**Diagnostic Steps**:
```javascript
// Check work stream associations
function debugAssociations() {
    const sprints = JSON.parse(localStorage.getItem('sprints') || '[]');
    const workStreams = JSON.parse(localStorage.getItem('workStreams') || '[]');
    
    console.log('Checking sprint -> work stream associations:');
    sprints.forEach(sprint => {
        if (sprint.workStreams && sprint.workStreams.length > 0) {
            console.log(`Sprint "${sprint.name}":`, sprint.workStreams);
            
            sprint.workStreams.forEach(wsId => {
                const ws = workStreams.find(w => w.id === wsId);
                if (!ws) {
                    console.error(`Missing work stream ${wsId} in sprint ${sprint.name}`);
                }
            });
        }
    });
    
    console.log('Checking work stream -> sprint associations:');
    workStreams.forEach(ws => {
        if (ws.sprints && ws.sprints.length > 0) {
            console.log(`Work stream "${ws.name}":`, ws.sprints);
            
            ws.sprints.forEach(sprintId => {
                const sprint = sprints.find(s => s.id === sprintId);
                if (!sprint) {
                    console.error(`Missing sprint ${sprintId} in work stream ${ws.name}`);
                }
            });
        }
    });
}
debugAssociations();
```

**Solutions**:
1. Re-associate work streams with sprints
2. Check for orphaned references
3. Use export/import to clean up associations
4. Manually fix data in localStorage if needed

## Import/Export Problems

### Export File Issues

**Problem**: Data export fails or produces invalid files.

**Symptoms**:
- No download occurs when clicking "Export Data"
- Downloaded file is empty or corrupted
- Import fails with exported data

**Diagnostic Steps**:
```javascript
// Test export functionality
function testExport() {
    try {
        if (typeof window.storageManager !== 'undefined') {
            const data = window.storageManager.exportData();
            console.log('Export data length:', data.length);
            
            // Validate JSON
            const parsed = JSON.parse(data);
            console.log('Export validation:', {
                sprints: parsed.sprints ? parsed.sprints.length : 0,
                workStreams: parsed.workStreams ? parsed.workStreams.length : 0,
                teamMembers: parsed.teamMembers ? parsed.teamMembers.length : 0
            });
        } else {
            console.error('StorageManager not available');
        }
    } catch (error) {
        console.error('Export test failed:', error);
    }
}
testExport();
```

**Solutions**:
1. Check browser download settings
2. Disable popup blockers temporarily
3. Try export in different browser
4. Manually copy data from localStorage

### Import Data Failures

**Problem**: Importing previously exported data fails.

**Symptoms**:
- "Invalid data format" errors
- Import appears to work but no data appears
- Application breaks after import

**Manual Import Process**:
```javascript
// Manual import via console
function manualImport(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        
        // Validate structure
        if (!data.sprints || !data.workStreams || !data.teamMembers) {
            throw new Error('Invalid data structure');
        }
        
        // Clear existing data
        localStorage.removeItem('sprints');
        localStorage.removeItem('workStreams');
        localStorage.removeItem('teamMembers');
        
        // Import new data
        localStorage.setItem('sprints', JSON.stringify(data.sprints));
        localStorage.setItem('workStreams', JSON.stringify(data.workStreams));
        localStorage.setItem('teamMembers', JSON.stringify(data.teamMembers));
        
        console.log('Manual import successful');
        location.reload();
        
    } catch (error) {
        console.error('Manual import failed:', error);
    }
}

// Usage: manualImport(yourJsonString);
```

**Solutions**:
1. Verify JSON file is valid
2. Check file encoding (should be UTF-8)
3. Use manual import process above
4. Contact support with problematic file

## Diagnostic Tools

### Built-in Debug Functions

```javascript
// Application debug information
function getDebugInfo() {
    if (typeof window.sprintApp === 'function') {
        const app = window.sprintApp();
        if (app.debugInfo) {
            app.debugInfo();
        }
    }
    
    // Storage statistics
    if (typeof window.storageManager !== 'undefined') {
        console.log('Storage stats:', window.storageManager.getStorageStats());
    }
    
    // Browser information
    console.log('Browser info:', {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
    });
}
```

### Health Check Script

```javascript
// Comprehensive health check
function healthCheck() {
    console.log('=== Product Manager LS Health Check ===');
    
    // 1. Feature support
    const features = checkBrowserSupport();
    
    // 2. Data integrity
    const dataValid = validateStorageData();
    
    // 3. Storage usage
    checkStorageQuota();
    
    // 4. Component availability
    const components = {
        sprintManager: typeof window.sprintManager !== 'undefined',
        teamManager: typeof window.teamManager !== 'undefined',
        workStreamManager: typeof window.workStreamManager !== 'undefined',
        capacityTracker: typeof window.capacityTracker !== 'undefined',
        storageManager: typeof window.storageManager !== 'undefined'
    };
    console.log('Components:', components);
    
    // 5. Service worker status
    checkServiceWorker();
    
    // 6. Overall status
    const healthy = features && dataValid && Object.values(components).every(c => c);
    console.log('Overall health:', healthy ? '✅ HEALTHY' : '❌ ISSUES DETECTED');
    
    return healthy;
}

// Run health check
healthCheck();
```

### Performance Monitor

```javascript
// Performance monitoring
function startPerformanceMonitoring() {
    let startTime = performance.now();
    
    // Monitor page load
    window.addEventListener('load', () => {
        const loadTime = performance.now() - startTime;
        console.log('Page load time:', loadTime.toFixed(2) + 'ms');
    });
    
    // Monitor localStorage operations
    const originalSetItem = localStorage.setItem;
    const originalGetItem = localStorage.getItem;
    
    localStorage.setItem = function(key, value) {
        const start = performance.now();
        const result = originalSetItem.call(this, key, value);
        const duration = performance.now() - start;
        
        if (duration > 10) {
            console.warn(`Slow localStorage.setItem for ${key}: ${duration.toFixed(2)}ms`);
        }
        
        return result;
    };
    
    localStorage.getItem = function(key) {
        const start = performance.now();
        const result = originalGetItem.call(this, key);
        const duration = performance.now() - start;
        
        if (duration > 5) {
            console.warn(`Slow localStorage.getItem for ${key}: ${duration.toFixed(2)}ms`);
        }
        
        return result;
    };
    
    console.log('Performance monitoring started');
}

// Start monitoring
startPerformanceMonitoring();
```

## Recovery Procedures

### Complete Data Recovery

#### From Export File

1. **Locate Export File**: Find your `.json` backup file
2. **Clear Current Data**: Use complete reset procedure
3. **Import Data**: Use manual import process
4. **Verify Recovery**: Check all data is present

#### From Browser Backup

```javascript
// Recover from browser sync (Chrome example)
function recoverFromBrowserSync() {
    // This requires the user to have Chrome sync enabled
    // and the data to be synced to their Google account
    
    console.log('To recover from Chrome sync:');
    console.log('1. Sign in to Chrome with the same account');
    console.log('2. Enable sync for "Extensions" and "Apps"');
    console.log('3. Wait for sync to complete');
    console.log('4. Reload the application');
}
```

### Partial Data Recovery

#### Recover Specific Data Type

```javascript
// Recover only sprints (example)
function recoverSprints(sprintData) {
    try {
        // Validate sprint data
        if (!Array.isArray(sprintData)) {
            throw new Error('Sprint data must be an array');
        }
        
        // Clear existing sprints
        localStorage.removeItem('sprints');
        
        // Import new sprint data
        localStorage.setItem('sprints', JSON.stringify(sprintData));
        
        console.log('Sprint recovery successful');
        location.reload();
        
    } catch (error) {
        console.error('Sprint recovery failed:', error);
    }
}
```

### Emergency Procedures

#### Nuclear Reset

```javascript
// EMERGENCY: Complete application reset
function emergencyReset() {
    const confirmed = confirm(
        'This will delete ALL data and reset the application. ' +
        'Are you sure you want to continue?'
    );
    
    if (confirmed) {
        // Clear all localStorage
        localStorage.clear();
        
        // Clear all sessionStorage
        sessionStorage.clear();
        
        // Unregister service workers
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                });
            });
        }
        
        // Clear caches
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }
        
        alert('Application reset complete. The page will now reload.');
        location.reload(true);
    }
}

// Usage: emergencyReset();
```

#### Safe Mode

```javascript
// Load in safe mode with minimal features
function enterSafeMode() {
    // Disable service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            registrations.forEach(registration => {
                registration.unregister();
            });
        });
    }
    
    // Load with basic configuration
    const safeConfig = {
        sprints: [],
        workStreams: [],
        teamMembers: []
    };
    
    Object.keys(safeConfig).forEach(key => {
        if (!localStorage.getItem(key)) {
            localStorage.setItem(key, JSON.stringify(safeConfig[key]));
        }
    });
    
    console.log('Safe mode activated');
    location.reload();
}
```

---

## Quick Reference

### Emergency Commands

```javascript
// Quick diagnostics
healthCheck();

// Clear problematic data
localStorage.removeItem('sprints');
localStorage.removeItem('workStreams');
localStorage.removeItem('teamMembers');

// Complete reset (USE WITH CAUTION)
localStorage.clear();
location.reload();

// Export current data
const backup = window.storageManager?.exportData();
console.log(backup);
```

### Support Information Collection

When reporting issues, include:

1. **Browser and version**
2. **Operating system**
3. **Console error messages**
4. **Steps to reproduce**
5. **Health check results**
6. **Export file (if data-related)**

This troubleshooting guide provides comprehensive solutions for most issues you might encounter with Product Manager LS. Follow the diagnostic steps to identify problems and apply the appropriate solutions.