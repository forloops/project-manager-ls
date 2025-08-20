const { chromium } = require('playwright');

async function testMultiActivityDirect() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    await page.waitForTimeout(3000);
    
    // Create test data and navigate to capacity planning
    const setupResult = await page.evaluate(() => {
      // Create team member
      if (window.teamManager) {
        window.teamManager.createTeamMember({
          name: 'Multi Activity Test User',
          role: 'Developer',
          email: 'multitest@example.com',
          defaultCapacity: 8
        });
      }
      
      // Create sprint
      if (window.sprintManager) {
        const sprintResult = window.sprintManager.createSprint({
          name: 'Multi Activity Sprint',
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
    
    console.log('✅ Test data created, waiting for planner to initialize...');
    await page.waitForTimeout(3000);
    
    // Check console logs for initialization messages
    page.on('console', msg => {
      if (msg.text().includes('ActivityCapacityCell') || msg.text().includes('containers')) {
        console.log('🔍 Browser log:', msg.text());
      }
    });
    
    // Check if planner was properly initialized
    const plannerStatus = await page.evaluate(() => {
      const container = document.getElementById('capacityPlannerContainer');
      const activityContainers = container ? container.querySelectorAll('.activity-capacity-cell-container') : [];
      const alpineComponent = document.querySelector('[x-data="capacityPlannerComponent()"]');
      
      return {
        hasContainer: !!container,
        containerHtml: container ? container.innerHTML.substring(0, 500) : 'No container',
        activityContainerCount: activityContainers.length,
        hasAlpineComponent: !!alpineComponent,
        plannerManagerExists: !!window.capacityPlannerManager
      };
    });
    
    console.log('\n📊 Planner Status:');
    console.log('Has container:', plannerStatus.hasContainer);
    console.log('Activity containers:', plannerStatus.activityContainerCount);
    console.log('Has Alpine component:', plannerStatus.hasAlpineComponent);
    console.log('Planner manager exists:', plannerStatus.plannerManagerExists);
    
    if (plannerStatus.activityContainerCount === 0) {
      console.log('\n🔍 Container HTML preview:');
      console.log(plannerStatus.containerHtml);
    }
    
    await page.screenshot({ path: 'test-multi-activity-direct.png', fullPage: true });
    console.log('\n📸 Screenshot saved: test-multi-activity-direct.png');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'test-multi-activity-error.png' });
  } finally {
    await browser.close();
  }
}

testMultiActivityDirect();
