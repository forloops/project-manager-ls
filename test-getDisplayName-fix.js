const { chromium } = require('playwright');
const path = require('path');

async function testGetDisplayNameFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const indexPath = path.resolve('./index.html');
    const fileUrl = `file://${indexPath}`;
    
    console.log(`Opening: ${fileUrl}`);
    
    // Enable console logging
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('getDisplayName') || text.includes('ActivityModel') || text.includes('TypeError')) {
        console.log('BROWSER ERROR:', text);
      } else {
        console.log('BROWSER:', text);
      }
    });
    
    await page.goto(fileUrl);
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    await page.waitForTimeout(2000);
    
    // Create test data
    const setupResult = await page.evaluate(() => {
      console.log('Creating test data to trigger getDisplayName...');
      
      // Create team member
      if (window.teamManager) {
        window.teamManager.createTeamMember({
          name: 'GetDisplayName Test User',
          role: 'Developer',
          email: 'getdisplayname@example.com',
          defaultCapacity: 8
        });
      }
      
      // Create sprint
      if (window.sprintManager) {
        const sprintResult = window.sprintManager.createSprint({
          name: 'GetDisplayName Test Sprint',
          startDate: '2025-08-20',
          endDate: '2025-08-24',
          duration: 1,
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
    
    console.log('✅ Test data created, monitoring for getDisplayName errors...');
    
    // Wait for full initialization
    await page.waitForTimeout(8000);
    
    // Check if any errors occurred
    const finalStatus = await page.evaluate(() => {
      const container = document.getElementById('capacityPlannerContainer');
      const activityContainers = container ? container.querySelectorAll('.activity-capacity-cell-container') : [];
      
      return {
        hasContainer: !!container,
        activityContainerCount: activityContainers.length,
        initializationComplete: activityContainers.length > 0
      };
    });
    
    console.log('\n📊 GetDisplayName Fix Results:');
    console.log('Has container:', finalStatus.hasContainer);
    console.log('Activity containers:', finalStatus.activityContainerCount);
    console.log('Initialization complete:', finalStatus.initializationComplete);
    
    const isFixed = finalStatus.initializationComplete;
    
    console.log('\n🎯 GetDisplayName Method Fix:');
    console.log(isFixed ? '✅ FIXED - No getDisplayName errors!' : '❌ Still broken - getDisplayName errors persist');
    
    await page.screenshot({ path: 'getDisplayName-fix.png', fullPage: true });
    console.log('\n📸 Screenshot saved: getDisplayName-fix.png');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testGetDisplayNameFix();
