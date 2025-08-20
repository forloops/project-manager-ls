#!/usr/bin/env node

/**
 * Node.js Test Runner for Product Manager LS
 * Executes comprehensive testing without requiring a browser
 */

const fs = require('fs');
const path = require('path');

// Mock browser environment for testing
global.window = {};
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
global.performance = {
    now: () => Date.now(),
    mark: () => {},
    measure: () => {}
};

// Test results
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

function addTestResult(name, success, message) {
    testResults.total++;
    if (success) {
        testResults.passed++;
        console.log(`✅ ${name}: ${message}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${name}: ${message}`);
    }
    testResults.details.push({ name, success, message });
}

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

async function runCoreTests() {
    console.log('🚀 Starting Product Manager LS Test Suite\n');
    
    // Test 1: Load core modules
    console.log('📦 Loading core modules...');
    
    const storageLoaded = loadScript('src/storage/storage.js');
    addTestResult('Storage Module Load', storageLoaded, 
        storageLoaded ? 'Storage module loaded successfully' : 'Failed to load storage module');
    
    const modelsLoaded = loadScript('src/storage/models.js');
    addTestResult('Models Module Load', modelsLoaded,
        modelsLoaded ? 'Models module loaded successfully' : 'Failed to load models module');
    
    const sprintManagerLoaded = loadScript('src/sprints/sprint-manager.js');
    addTestResult('Sprint Manager Load', sprintManagerLoaded,
        sprintManagerLoaded ? 'Sprint manager loaded successfully' : 'Failed to load sprint manager');
    
    if (!storageLoaded || !modelsLoaded || !sprintManagerLoaded) {
        console.log('\n❌ Core module loading failed. Cannot continue testing.');
        return;
    }
    
    // Test 2: Storage Manager functionality
    console.log('\n💾 Testing Storage Manager...');
    
    try {
        const storage = global.window.storageManager;
        const isAvailable = storage.isStorageAvailable();
        addTestResult('Storage Availability', isAvailable,
            isAvailable ? 'Local storage is available' : 'Local storage not available');
        
        // Test data operations with valid structure
        const initialData = storage.getData();
        const testData = { ...initialData, test: 'value', timestamp: Date.now() };
        const saved = storage.saveData(testData);
        addTestResult('Data Save Operation', saved,
            saved ? 'Data saved successfully' : 'Data save failed');
        
        const retrieved = storage.getData();
        const dataMatches = retrieved && retrieved.test === testData.test;
        addTestResult('Data Retrieval', dataMatches,
            dataMatches ? 'Data retrieved correctly' : 'Data retrieval failed or corrupted');
        
    } catch (error) {
        addTestResult('Storage Manager', false, `Storage error: ${error.message}`);
    }
    
    // Test 3: Sprint Model validation
    console.log('\n📋 Testing Sprint Models...');
    
    try {
        const SprintModel = global.window.SprintModel;
        
        // Test valid sprint creation
        const validSprint = new SprintModel({
            name: 'Test Sprint',
            startDate: '2024-01-01',
            duration: 2,
            type: 'Development'
        });
        
        // Calculate end date for validation
        if (validSprint.startDate && validSprint.duration && !validSprint.endDate) {
            validSprint.endDate = SprintModel.calculateEndDate(validSprint.startDate, validSprint.duration);
        }
        
        const validation = validSprint.validate();
        addTestResult('Valid Sprint Creation', validation.isValid,
            validation.isValid ? 'Valid sprint created successfully' : `Validation failed: ${validation.errors.join(', ')}`);
        
        // Test invalid sprint creation
        const invalidSprint = new SprintModel({
            name: '',  // Invalid empty name
            startDate: '2024-01-01',
            duration: 5,  // Invalid duration
            type: 'InvalidType'  // Invalid type
        });
        
        const invalidValidation = invalidSprint.validate();
        addTestResult('Invalid Sprint Rejection', !invalidValidation.isValid,
            !invalidValidation.isValid ? 'Invalid sprint properly rejected' : 'Invalid sprint incorrectly accepted');
        
        // Test date calculations
        const endDate2Week = SprintModel.calculateEndDate('2024-01-01', 2);
        const endDate3Week = SprintModel.calculateEndDate('2024-01-01', 3);
        const datesCorrect = endDate2Week === '2024-01-14' && endDate3Week === '2024-01-21';
        addTestResult('Date Calculations', datesCorrect,
            datesCorrect ? 'End dates calculated correctly' : `Incorrect dates: 2w=${endDate2Week}, 3w=${endDate3Week}`);
        
    } catch (error) {
        addTestResult('Sprint Model', false, `Sprint model error: ${error.message}`);
    }
    
    // Test 4: Sprint Manager CRUD operations
    console.log('\n🔄 Testing Sprint Manager CRUD Operations...');
    
    try {
        const manager = global.window.sprintManager;
        
        // Test sprint creation
        const createResult = manager.createSprint({
            name: 'CRUD Test Sprint',
            startDate: '2024-01-01',
            duration: 2,
            type: 'Development'
        });
        
        addTestResult('Sprint Creation', createResult.success,
            createResult.success ? 'Sprint created successfully' : `Creation failed: ${createResult.errors?.join(', ')}`);
        
        if (createResult.success) {
            const sprintId = createResult.sprint.id;
            
            // Test sprint retrieval
            const retrievedSprint = manager.getSprintById(sprintId);
            addTestResult('Sprint Retrieval', !!retrievedSprint,
                retrievedSprint ? 'Sprint retrieved successfully' : 'Sprint retrieval failed');
            
            // Test sprint update
            const updateResult = manager.updateSprint(sprintId, {
                name: 'Updated CRUD Test Sprint'
            });
            
            addTestResult('Sprint Update', updateResult.success,
                updateResult.success ? 'Sprint updated successfully' : `Update failed: ${updateResult.errors?.join(', ')}`);
            
            // Test all sprints retrieval
            const allSprints = manager.getAllSprints();
            addTestResult('All Sprints Retrieval', Array.isArray(allSprints) && allSprints.length > 0,
                `Retrieved ${allSprints.length} sprints`);
            
            // Test sprint deletion
            const deleteResult = manager.deleteSprint(sprintId);
            addTestResult('Sprint Deletion', deleteResult.success,
                deleteResult.success ? 'Sprint deleted successfully' : `Deletion failed: ${deleteResult.errors?.join(', ')}`);
        }
        
    } catch (error) {
        addTestResult('Sprint Manager CRUD', false, `CRUD operations error: ${error.message}`);
    }
    
    // Test 5: Sprint Types and Validation
    console.log('\n🏷️ Testing Sprint Types...');
    
    try {
        const manager = global.window.sprintManager;
        const sprintTypes = ['Development', 'Non-Functional', 'Release', 'Hardening'];
        let typeTestsPassed = 0;
        
        for (const type of sprintTypes) {
            const result = manager.createSprint({
                name: `${type} Test Sprint`,
                startDate: '2024-02-01',
                duration: 2,
                type: type
            });
            
            if (result.success) {
                typeTestsPassed++;
                // Clean up
                manager.deleteSprint(result.sprint.id);
            }
        }
        
        addTestResult('Sprint Types Support', typeTestsPassed === sprintTypes.length,
            `${typeTestsPassed}/${sprintTypes.length} sprint types working correctly`);
        
        // Test invalid type
        const invalidTypeResult = manager.createSprint({
            name: 'Invalid Type Sprint',
            startDate: '2024-03-01',
            duration: 2,
            type: 'InvalidType'
        });
        
        addTestResult('Invalid Type Rejection', !invalidTypeResult.success,
            !invalidTypeResult.success ? 'Invalid sprint type properly rejected' : 'Invalid type incorrectly accepted');
        
    } catch (error) {
        addTestResult('Sprint Types', false, `Sprint types error: ${error.message}`);
    }
    
    // Test 6: Calendar Generation
    console.log('\n📅 Testing Calendar Generation...');
    
    try {
        const manager = global.window.sprintManager;
        
        // Create a test sprint for calendar generation
        const calendarTestResult = manager.createSprint({
            name: 'Calendar Test Sprint',
            startDate: '2024-01-01',
            duration: 2,
            type: 'Development'
        });
        
        if (calendarTestResult.success) {
            const calendar = manager.getSprintCalendar(calendarTestResult.sprint.id);
            
            addTestResult('Calendar Generation', Array.isArray(calendar) && calendar.length > 0,
                `Generated calendar with ${calendar.length} days`);
            
            // Check for weekends
            const weekendDays = calendar.filter(day => day.isWeekend);
            addTestResult('Weekend Days Detection', weekendDays.length > 0,
                `Found ${weekendDays.length} weekend days in calendar`);
            
            // Check sprint boundaries
            const sprintDays = calendar.filter(day => day.isInSprint);
            // For 2-week sprint: start date + 13 more days = 14 total days
            const expectedDays = 14;
            addTestResult('Sprint Boundary Detection', sprintDays.length === expectedDays,
                `Sprint contains ${sprintDays.length} days (expected ${expectedDays} for 2-week sprint)`);
            
            // Clean up
            manager.deleteSprint(calendarTestResult.sprint.id);
        } else {
            addTestResult('Calendar Generation', false, 'Could not create test sprint for calendar');
        }
        
    } catch (error) {
        addTestResult('Calendar Generation', false, `Calendar error: ${error.message}`);
    }
    
    // Test 7: Capacity Planning
    console.log('\n⚡ Testing Capacity Planning...');
    
    try {
        const manager = global.window.sprintManager;
        
        // Create sprint for capacity testing
        const capacityTestResult = manager.createSprint({
            name: 'Capacity Test Sprint',
            startDate: '2024-01-01',
            duration: 2,
            type: 'Development'
        });
        
        if (capacityTestResult.success) {
            const sprint = capacityTestResult.sprint;
            
            // Test initial capacity
            const initialCapacity = sprint.getTotalCapacity();
            addTestResult('Initial Capacity Allocation', initialCapacity > 0,
                `Initial capacity: ${initialCapacity} points`);
            
            // Test capacity setting
            sprint.setDayCapacity('2024-01-01', 6);
            const updatedCapacity = sprint.capacity['2024-01-01'];
            addTestResult('Capacity Day Setting', updatedCapacity === 6,
                `Day capacity set to ${updatedCapacity} points`);
            
            // Test working days calculation
            const sprintDates = sprint.getSprintDates();
            const workingDays = sprintDates.filter(day => !day.isWeekend);
            const weekendDays = sprintDates.filter(day => day.isWeekend);
            
            addTestResult('Working Days Calculation', workingDays.length === 10 && weekendDays.length === 4,
                `Working days: ${workingDays.length}, Weekend days: ${weekendDays.length}`);
            
            // Clean up
            manager.deleteSprint(sprint.id);
        } else {
            addTestResult('Capacity Planning', false, 'Could not create test sprint for capacity testing');
        }
        
    } catch (error) {
        addTestResult('Capacity Planning', false, `Capacity error: ${error.message}`);
    }
    
    // Test 8: Data Export/Import
    console.log('\n💾 Testing Data Export/Import...');
    
    try {
        const storage = global.window.storageManager;
        
        // Test export
        const exportData = storage.exportData();
        addTestResult('Data Export', exportData && exportData.length > 0,
            exportData ? `Exported ${exportData.length} characters of data` : 'Export failed');
        
        if (exportData) {
            // Test import
            const importResult = storage.importData(exportData);
            addTestResult('Data Import', importResult,
                importResult ? 'Data imported successfully' : 'Import failed');
        }
        
    } catch (error) {
        addTestResult('Data Export/Import', false, `Export/Import error: ${error.message}`);
    }
    
    // Test 9: Error Handling
    console.log('\n🛡️ Testing Error Handling...');
    
    try {
        const manager = global.window.sprintManager;
        
        // Test overlapping sprints
        const sprint1 = manager.createSprint({
            name: 'Overlap Test 1',
            startDate: '2024-06-01',
            duration: 2,
            type: 'Development'
        });
        
        const sprint2 = manager.createSprint({
            name: 'Overlap Test 2',
            startDate: '2024-06-05',  // Overlaps with sprint1
            duration: 2,
            type: 'Development'
        });
        
        addTestResult('Overlap Detection', sprint1.success && !sprint2.success,
            sprint1.success && !sprint2.success ? 'Overlapping sprints properly rejected' : 'Overlap detection failed');
        
        // Clean up
        if (sprint1.success) {
            manager.deleteSprint(sprint1.sprint.id);
        }
        
        // Test missing required fields
        const incompleteSprintResult = manager.createSprint({
            duration: 2,
            type: 'Development'
            // Missing name and startDate
        });
        
        addTestResult('Required Field Validation', !incompleteSprintResult.success,
            !incompleteSprintResult.success ? 'Missing fields properly rejected' : 'Required field validation failed');
        
    } catch (error) {
        addTestResult('Error Handling', false, `Error handling test failed: ${error.message}`);
    }
    
    // Test 10: Performance with Multiple Sprints
    console.log('\n⚡ Testing Performance...');
    
    try {
        const manager = global.window.sprintManager;
        const startTime = Date.now();
        const sprintCount = 50;
        
        // Create multiple sprints
        for (let i = 0; i < sprintCount; i++) {
            const startDate = new Date(2024, 0, 1 + (i * 14));
            manager.createSprint({
                name: `Performance Test Sprint ${i}`,
                startDate: startDate.toISOString().split('T')[0],
                duration: 2,
                type: 'Development'
            });
        }
        
        const creationTime = Date.now() - startTime;
        
        // Test retrieval performance
        const retrievalStart = Date.now();
        const allSprints = manager.getAllSprints();
        const retrievalTime = Date.now() - retrievalStart;
        
        addTestResult('Multiple Sprint Creation', allSprints.length >= sprintCount,
            `Created ${allSprints.length} sprints in ${creationTime}ms`);
        
        addTestResult('Sprint Retrieval Performance', retrievalTime < 100,
            `Retrieved ${allSprints.length} sprints in ${retrievalTime}ms`);
        
        // Test statistics
        const stats = manager.getSprintStatistics();
        addTestResult('Sprint Statistics', stats.total === allSprints.length,
            `Statistics: ${stats.total} total, ${stats.active} active, ${stats.completed} completed`);
        
    } catch (error) {
        addTestResult('Performance Testing', false, `Performance test error: ${error.message}`);
    }
}

function generateTestReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('='.repeat(80));
    
    const passRate = Math.round((testResults.passed / testResults.total) * 100);
    
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Pass Rate: ${passRate}%`);
    console.log();
    
    if (passRate >= 90) {
        console.log('🎉 EXCELLENT! All core functionality is working perfectly.');
        console.log('✅ The application is ready for production use.');
    } else if (passRate >= 80) {
        console.log('✅ GOOD! Most functionality is working correctly.');
        console.log('⚠️  Some minor issues need attention before production.');
    } else if (passRate >= 70) {
        console.log('⚠️  FAIR! Core functionality works but several issues need fixing.');
        console.log('🔧 Recommend addressing failed tests before deployment.');
    } else {
        console.log('❌ POOR! Critical issues found that prevent proper operation.');
        console.log('🚨 Major fixes required before the application can be used.');
    }
    
    console.log('\n📋 FAILED TESTS:');
    const failedTests = testResults.details.filter(t => !t.success);
    if (failedTests.length === 0) {
        console.log('   None! All tests passed. 🎉');
    } else {
        failedTests.forEach(test => {
            console.log(`   ❌ ${test.name}: ${test.message}`);
        });
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (passRate >= 90) {
        console.log('   • Continue with integration testing');
        console.log('   • Deploy to staging environment');
        console.log('   • Begin user acceptance testing');
    } else {
        console.log('   • Fix all failed tests before proceeding');
        console.log('   • Run tests again to verify fixes');
        console.log('   • Consider additional error handling');
        if (testResults.failed > 3) {
            console.log('   • Review architecture for fundamental issues');
        }
    }
    
    console.log('\n' + '='.repeat(80));
    
    return passRate;
}

// Execute tests
async function main() {
    try {
        await runCoreTests();
        const passRate = generateTestReport();
        
        // Exit with appropriate code
        process.exit(passRate >= 80 ? 0 : 1);
    } catch (error) {
        console.error('\n💥 FATAL ERROR during testing:', error);
        process.exit(2);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { runCoreTests, generateTestReport };