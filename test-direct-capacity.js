const { chromium } = require('playwright');

async function testDirectCapacity() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    let jsErrors = [];
    let consoleMessages = [];
    
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:62080');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    // Check what capacity planning components are available
    console.log('\\n=== Checking Capacity Infrastructure ===');
    
    const capacityInfrastructure = await page.evaluate(() => {
      return {
        capacityPlannerManager: typeof window.capacityPlannerManager !== 'undefined',
        capacityDashboardManager: typeof window.capacityDashboardManager !== 'undefined',
        activityModal: typeof window.activityModal !== 'undefined',
        ActivityCapacityCell: typeof window.ActivityCapacityCell !== 'undefined',
        capacityTracker: typeof window.capacityTracker !== 'undefined'
      };
    });
    
    console.log('Capacity infrastructure:', JSON.stringify(capacityInfrastructure, null, 2));
    
    // Try to manually initialize the capacity planner
    console.log('\\n=== Manual Capacity Planner Test ===');
    
    const manualTest = await page.evaluate(() => {
      try {
        // Check if we can manually create some test data and initialize the planner
        
        // Create test team member
        if (window.teamManager) {
          const testMember = {
            name: 'Test Developer',
            role: 'Developer',
            email: 'test@example.com',
            defaultCapacity: 8
          };
          
          const memberResult = window.teamManager.createTeamMember(testMember);
          console.log('Team member creation:', memberResult);
        }
        
        // Create test sprint
        if (window.sprintManager) {
          const testSprint = {
            name: 'Test Sprint',
            startDate: '2025-08-20',
            duration: 2,
            type: 'Development'
          };
          
          const sprintResult = window.sprintManager.createSprint(testSprint);
          console.log('Sprint creation:', sprintResult);
          
          if (sprintResult.success) {
            // Try to initialize the capacity planner
            if (window.capacityPlannerManager) {
              const initResult = window.capacityPlannerManager.initializePlanner('capacityPlannerContainer', sprintResult.sprint.id);
              console.log('Capacity planner initialization:', initResult);
              
              return {
                success: true,
                sprintId: sprintResult.sprint.id,
                plannerInitialized: initResult
              };
            }
          }
        }
        
        return { success: false, error: 'Missing managers' };
        
      } catch (error) {
        console.log('Manual test error:', error.message);
        return { success: false, error: error.message };
      }
    });
    
    console.log('Manual test result:', JSON.stringify(manualTest, null, 2));
    
    // Check if capacity planner container exists and what's in it
    await page.waitForTimeout(2000);
    
    const containerAnalysis = await page.evaluate(() => {
      const container = document.getElementById('capacityPlannerContainer');
      if (!container) {
        return { exists: false };
      }
      
      return {
        exists: true,
        hasContent: container.innerHTML.length > 0,
        hasActivityCells: container.querySelectorAll('.activity-capacity-cell-container').length,
        hasActualCells: container.querySelectorAll('.activity-capacity-cell').length,
        hasBasicInputs: container.querySelectorAll('input[type="number"]').length,
        content: container.innerHTML.substring(0, 500) + '...'
      };
    });
    
    console.log('\\nCapacity planner container analysis:');
    console.log(JSON.stringify(containerAnalysis, null, 2));
    
    // Look for any initialization logs
    const initLogs = consoleMessages.filter(msg => 
      msg.includes('initializeActivityCells') || 
      msg.includes('ActivityCapacityCell') ||
      msg.includes('capacity-planner') ||
      msg.includes('initializePlanner')
    );
    
    if (initLogs.length > 0) {
      console.log('\\nInitialization logs:');
      initLogs.forEach(log => console.log(`  ${log}`));
    }
    
    await page.screenshot({ path: 'direct-capacity-test.png', fullPage: true });
    console.log('\\nScreenshot saved: direct-capacity-test.png');
    
    if (jsErrors.length > 0) {
      console.log('\\nJavaScript errors:');
      jsErrors.forEach(error => console.log(`❌ ${error}`));
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'direct-test-error.png' });
  } finally {
    await browser.close();
  }
}

testDirectCapacity();