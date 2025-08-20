const { chromium } = require('playwright');

async function debugAlpineReactivity() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:62080');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    await page.waitForTimeout(2000);
    
    // Debug Alpine.js state and reactivity
    const alpineDebug = await page.evaluate(() => {
      const appElement = document.querySelector('[x-data*="sprintApp"]');
      if (!appElement || !Alpine) {
        return { error: 'Alpine or app element not found' };
      }
      
      const appData = Alpine.$data(appElement);
      
      // Check all capacity view related elements
      const dashboardDiv = document.querySelector('[x-show="capacityViewMode === \'overview\'"]');
      const plannerDiv = document.querySelector('[x-show="capacityViewMode === \'planner\'"]');
      const analyticsDiv = document.querySelector('[x-show="capacityViewMode === \'analytics\'"]');
      
      return {
        currentViewMode: appData.capacityViewMode,
        dashboardDiv: {
          exists: !!dashboardDiv,
          display: dashboardDiv?.style.display,
          hidden: dashboardDiv?.hidden,
          visible: dashboardDiv && !dashboardDiv.hasAttribute('style') || dashboardDiv?.style.display !== 'none'
        },
        plannerDiv: {
          exists: !!plannerDiv,
          display: plannerDiv?.style.display,
          hidden: plannerDiv?.hidden,
          visible: plannerDiv && !plannerDiv.hasAttribute('style') || plannerDiv?.style.display !== 'none'
        },
        analyticsDiv: {
          exists: !!analyticsDiv,
          display: analyticsDiv?.style.display,
          hidden: analyticsDiv?.hidden,
          visible: analyticsDiv && !analyticsDiv.hasAttribute('style') || analyticsDiv?.style.display !== 'none'
        }
      };
    });
    
    console.log('\\nAlpine Debug (before change):', JSON.stringify(alpineDebug, null, 2));
    
    // Manually create data and switch views
    const switchResult = await page.evaluate(() => {
      try {
        // Create test data
        if (window.teamManager) {
          window.teamManager.createTeamMember({
            name: 'Debug User',
            role: 'Developer',
            email: 'debug@test.com',
            defaultCapacity: 8
          });
        }
        
        if (window.sprintManager) {
          const sprintResult = window.sprintManager.createSprint({
            name: 'Debug Sprint',
            startDate: '2025-08-20',
            duration: 2,
            type: 'Development'
          });
          
          if (sprintResult.success) {
            const appElement = document.querySelector('[x-data*="sprintApp"]');
            const appData = Alpine.$data(appElement);
            
            // Try different ways to switch the view
            console.log('Current view mode before switch:', appData.capacityViewMode);
            
            // Method 1: Direct assignment
            appData.capacityViewMode = 'planner';
            appData.selectedSprintId = sprintResult.sprint.id;
            
            // Method 2: Call the method
            if (typeof appData.planSprintCapacity === 'function') {
              appData.planSprintCapacity(sprintResult.sprint.id);
            }
            
            // Method 3: Manual switchCapacityView
            if (typeof appData.switchCapacityView === 'function') {
              appData.switchCapacityView();
            }
            
            console.log('View mode after switch:', appData.capacityViewMode);
            
            return {
              success: true,
              sprintId: sprintResult.sprint.id,
              viewMode: appData.capacityViewMode,
              selectedSprintId: appData.selectedSprintId
            };
          }
        }
        
        return { success: false, error: 'Failed to create sprint' };
        
      } catch (error) {
        console.log('Switch error:', error.message);
        return { success: false, error: error.message };
      }
    });
    
    console.log('\\nSwitch result:', JSON.stringify(switchResult, null, 2));
    
    // Wait for Alpine to react
    await page.waitForTimeout(1000);
    
    // Check the state after the switch
    const afterSwitch = await page.evaluate(() => {
      const appElement = document.querySelector('[x-data*="sprintApp"]');
      const appData = Alpine.$data(appElement);
      
      const dashboardDiv = document.querySelector('[x-show="capacityViewMode === \'overview\'"]');
      const plannerDiv = document.querySelector('[x-show="capacityViewMode === \'planner\'"]');
      
      return {
        viewMode: appData.capacityViewMode,
        dashboardVisible: dashboardDiv && (dashboardDiv.style.display !== 'none'),
        plannerVisible: plannerDiv && (plannerDiv.style.display !== 'none'),
        dashboardStyle: dashboardDiv?.getAttribute('style'),
        plannerStyle: plannerDiv?.getAttribute('style'),
        plannerHasContent: document.getElementById('capacityPlannerContainer')?.innerHTML.length > 0
      };
    });
    
    console.log('\\nAfter switch:', JSON.stringify(afterSwitch, null, 2));
    
    // Force the view to show manually
    const forceResult = await page.evaluate(() => {
      const plannerDiv = document.querySelector('[x-show="capacityViewMode === \'planner\'"]');
      const dashboardDiv = document.querySelector('[x-show="capacityViewMode === \'overview\'"]');
      
      if (plannerDiv) {
        plannerDiv.style.display = 'block';
        plannerDiv.removeAttribute('hidden');
      }
      
      if (dashboardDiv) {
        dashboardDiv.style.display = 'none';
      }
      
      return {
        plannerForced: !!plannerDiv,
        dashboardHidden: !!dashboardDiv
      };
    });
    
    console.log('\\nForce result:', JSON.stringify(forceResult, null, 2));
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'alpine-debug.png', fullPage: true });
    console.log('\\nDebug screenshot saved: alpine-debug.png');
    
  } catch (error) {
    console.error('Debug error:', error);
    await page.screenshot({ path: 'alpine-debug-error.png' });
  } finally {
    await browser.close();
  }
}

debugAlpineReactivity();