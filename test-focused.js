#!/usr/bin/env node

/**
 * Focused Test to Identify Specific Issues
 */

const fs = require('fs');
const path = require('path');

// Mock browser environment more completely
global.window = {
    dispatchEvent: () => true  // Add this missing method
};
global.document = {
    createElement: () => ({ appendChild: () => {}, setAttribute: () => {} }),
    getElementById: () => ({ innerHTML: '', textContent: '', appendChild: () => {} }),
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => []
};
global.localStorage = {
    data: {},
    getItem: function(key) { return this.data[key] || null; },
    setItem: function(key, value) { this.data[key] = value; },
    removeItem: function(key) { delete this.data[key]; },
    clear: function() { this.data = {}; }
};
global.console = console;
global.Date = Date;
global.JSON = JSON;
global.Math = Math;

function loadScript(filePath) {
    try {
        const fullPath = path.join(__dirname, filePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        eval(content);
        return true;
    } catch (error) {
        console.error(`Failed to load ${filePath}:`, error.message);
        return false;
    }
}

async function runFocusedTests() {
    console.log('🔍 Running Focused Tests to Identify Issues\n');
    
    // Clear storage first
    localStorage.clear();
    
    // Load modules
    console.log('📦 Loading modules...');
    if (!loadScript('src/storage/storage.js')) return;
    if (!loadScript('src/storage/models.js')) return;
    if (!loadScript('src/sprints/sprint-manager.js')) return;
    
    console.log('✅ All modules loaded successfully\n');
    
    // Test 1: Check global objects
    console.log('🔍 Test 1: Global Objects');
    console.log('storageManager:', typeof global.window.storageManager);
    console.log('SprintModel:', typeof global.window.SprintModel);
    console.log('sprintManager:', typeof global.window.sprintManager);
    
    // Test 2: Check storage initialization
    console.log('\n🔍 Test 2: Storage Initialization');
    try {
        const storage = global.window.storageManager;
        console.log('Storage available:', storage.isStorageAvailable());
        
        const initialData = storage.getData();
        console.log('Initial data:', JSON.stringify(initialData, null, 2));
        console.log('Data structure valid:', storage.validateDataStructure(initialData));
    } catch (error) {
        console.error('Storage initialization error:', error.message);
    }
    
    // Test 3: Test SprintModel directly
    console.log('\n🔍 Test 3: SprintModel Creation');
    try {
        const SprintModel = global.window.SprintModel;
        const sprintData = {
            name: 'Test Sprint',
            startDate: '2024-01-01',
            duration: 2,
            type: 'Development'
        };
        
        console.log('Creating sprint with data:', sprintData);
        const sprint = new SprintModel(sprintData);
        console.log('Sprint created, initial state:', sprint.toJSON());
        
        // Calculate end date
        if (sprint.startDate && sprint.duration && !sprint.endDate) {
            sprint.endDate = SprintModel.calculateEndDate(sprint.startDate, sprint.duration);
            console.log('End date calculated:', sprint.endDate);
        }
        
        const validation = sprint.validate();
        console.log('Validation result:', validation);
        
    } catch (error) {
        console.error('SprintModel error:', error.message);
        console.error('Stack:', error.stack);
    }
    
    // Test 4: Test SprintManager
    console.log('\n🔍 Test 4: SprintManager Operation');
    try {
        const manager = global.window.sprintManager;
        console.log('Manager loaded sprints:', manager.getAllSprints().length);
        
        const sprintData = {
            name: 'Manager Test Sprint',
            startDate: '2024-01-01',
            duration: 2,
            type: 'Development'
        };
        
        console.log('Creating sprint via manager...');
        const result = manager.createSprint(sprintData);
        console.log('Creation result:', JSON.stringify(result, null, 2));
        
        if (result.success) {
            console.log('Sprint created successfully!');
            const allSprints = manager.getAllSprints();
            console.log('Total sprints now:', allSprints.length);
        } else {
            console.log('Sprint creation failed:', result.errors);
        }
        
    } catch (error) {
        console.error('SprintManager error:', error.message);
        console.error('Stack:', error.stack);
    }
    
    // Test 5: Storage state after operations
    console.log('\n🔍 Test 5: Final Storage State');
    try {
        const storage = global.window.storageManager;
        const finalData = storage.getData();
        console.log('Final storage data:', JSON.stringify(finalData, null, 2));
        console.log('Sprint count in storage:', finalData?.sprints?.length || 0);
    } catch (error) {
        console.error('Final storage check error:', error.message);
    }
}

runFocusedTests().catch(console.error);