const { chromium } = require('playwright');

async function testViewSwitch() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    let consoleMessages = [];
    
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    });
    
    await page.goto('http://localhost:62080');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    // Wait for Alpine to initialize
    await page.waitForTimeout(2000);
    
    // Check the current capacity view mode
    const initialState = await page.evaluate(() => {
      const appElement = document.querySelector('[x-data*="sprintApp"]');
      if (appElement && Alpine) {
        const appData = Alpine.$data(appElement);
        return {
          capacityViewMode: appData.capacityViewMode,
          selectedSprintId: appData.selectedSprintId,
          plannerContainerExists: !!document.getElementById('capacityPlannerContainer'),
          plannerVisible: document.querySelector('[x-show="capacityViewMode === \'planner\'"]')?.style.display !== 'none'
        };
      }
      return { error: 'Alpine or app element not found' };
    });
    
    console.log('\\nInitial state:', JSON.stringify(initialState, null, 2));
    
    // Manually create test data and switch to planner view
    const testResult = await page.evaluate(() => {
      try {
        // Create test team member
        if (window.teamManager) {
          const testMember = {
            name: 'Activity Test User',
            role: 'Developer',
            email: 'test@example.com',
            defaultCapacity: 8
          };
          window.teamManager.createTeamMember(testMember);
        }
        
        // Create test sprint
        if (window.sprintManager) {
          const testSprint = {
            name: 'Activity Test Sprint',
            startDate: '2025-08-20',
            duration: 2,
            type: 'Development'
          };
          const sprintResult = window.sprintManager.createSprint(testSprint);
          
          if (sprintResult.success) {
            // Get the app instance and manually trigger planSprintCapacity
            const appElement = document.querySelector('[x-data*="sprintApp"]');
            if (appElement && Alpine) {
              const appData = Alpine.$data(appElement);
              
              // Manually call planSprintCapacity
              appData.planSprintCapacity(sprintResult.sprint.id);
              
              return {
                success: true,
                sprintId: sprintResult.sprint.id,
                newViewMode: appData.capacityViewMode,
                selectedSprintId: appData.selectedSprintId
              };
            }
          }
        }
        
        return { success: false, error: 'Failed to create sprint or get app data' };
        
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('\\nTest result:', JSON.stringify(testResult, null, 2));
    
    // Wait for view switch to take effect
    await page.waitForTimeout(2000);
    
    // Check if the planner view is now visible
    const afterSwitch = await page.evaluate(() => {
      const plannerDiv = document.querySelector('[x-show="capacityViewMode === \'planner\'"]');
      const plannerContainer = document.getElementById('capacityPlannerContainer');
      
      return {
        plannerDivVisible: plannerDiv && !plannerDiv.hasAttribute('style') || plannerDiv?.style.display !== 'none',
        plannerContainerHasContent: plannerContainer && plannerContainer.innerHTML.trim().length > 0,
        plannerContent: plannerContainer ? plannerContainer.innerHTML.substring(0, 200) + '...' : 'No container',
        activityCellContainers: document.querySelectorAll('.activity-capacity-cell-container').length,
        activityCells: document.querySelectorAll('.activity-capacity-cell').length
      };
    });
    
    console.log('\\nAfter view switch:', JSON.stringify(afterSwitch, null, 2));
    
    // Take screenshot to see the result
    await page.screenshot({ path: 'view-switch-test.png', fullPage: true });
    console.log('\\nScreenshot saved: view-switch-test.png');
    
    // Check for any logs about activity cell initialization
    const activityLogs = consoleMessages.filter(msg => 
      msg.includes('activity') || 
      msg.includes('Activity') ||
      msg.includes('initializeActivityCells') ||
      msg.includes('capacity-planner')
    );
    
    if (activityLogs.length > 0) {
      console.log('\\nActivity-related logs:');
      activityLogs.forEach(log => console.log(`  ${log}`));
    } else {
      console.log('\\nNo activity-related logs found');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'view-switch-error.png' });
  } finally {
    await browser.close();
  }
}

testViewSwitch();