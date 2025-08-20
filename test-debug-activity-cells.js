const { chromium } = require('playwright');

async function testDebugActivityCells() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Enable console logging
    page.on('console', msg => {
      console.log('BROWSER:', msg.text());
    });
    
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    await page.waitForTimeout(2000);
    
    // Create test data
    const setupResult = await page.evaluate(() => {
      // Create team member
      if (window.teamManager) {
        window.teamManager.createTeamMember({
          name: 'Debug Test User',
          role: 'Developer',
          email: 'debug@example.com',
          defaultCapacity: 8
        });
      }
      
      // Create sprint
      if (window.sprintManager) {
        const sprintResult = window.sprintManager.createSprint({
          name: 'Debug Test Sprint',
          startDate: '2025-08-20',
          duration: 2,
          type: 'Development'
        });
        
        if (sprintResult.success) {
          // Navigate to capacity planning
          const appElement = document.querySelector('[x-data*="sprintApp"]');
          const appData = Alpine.$data(appElement);
          appData.planSprintCapacity(sprintResult.sprint.id);
          
          return {
            success: true,
            sprintId: sprintResult.sprint.id
          };
        }
      }
      
      return { success: false };
    });
    
    if (!setupResult.success) {
      console.log('❌ Test setup failed');
      return;
    }
    
    console.log('✅ Test data created, watching console for debug output...');
    
    // Wait for all the async operations to complete
    await page.waitForTimeout(5000);
    
    // Check final state
    const finalState = await page.evaluate(() => {
      const container = document.getElementById('capacityPlannerContainer');
      const activityContainers = container ? container.querySelectorAll('.activity-capacity-cell-container') : [];
      
      return {
        hasContainer: !!container,
        activityContainerCount: activityContainers.length,
        containerHTML: container ? container.innerHTML.substring(0, 800) : 'No container'
      };
    });
    
    console.log('\n📊 Final State:');
    console.log('Has container:', finalState.hasContainer);
    console.log('Activity containers:', finalState.activityContainerCount);
    
    if (finalState.activityContainerCount === 0) {
      console.log('\n🔍 Container HTML preview:');
      console.log(finalState.containerHTML);
    }
    
    await page.screenshot({ path: 'debug-activity-cells.png', fullPage: true });
    console.log('\n📸 Screenshot saved: debug-activity-cells.png');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testDebugActivityCells();
