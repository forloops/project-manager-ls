const { chromium } = require('playwright');
const path = require('path');

async function testDateGenerationFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const indexPath = path.resolve('./index.html');
    const fileUrl = `file://${indexPath}`;
    
    console.log(`Opening: ${fileUrl}`);
    
    // Enable console logging
    page.on('console', msg => {
      console.log('BROWSER:', msg.text());
    });
    
    await page.goto(fileUrl);
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    await page.waitForTimeout(2000);
    
    // Create test data
    const setupResult = await page.evaluate(() => {
      console.log('Creating test data for date generation fix...');
      
      // Create team member
      if (window.teamManager) {
        window.teamManager.createTeamMember({
          name: 'Date Test User',
          role: 'Developer',
          email: 'datetest@example.com',
          defaultCapacity: 8
        });
      }
      
      // Create sprint with explicit date range
      if (window.sprintManager) {
        const sprintResult = window.sprintManager.createSprint({
          name: 'Date Generation Test Sprint',
          startDate: '2025-08-20',
          endDate: '2025-08-29', // 10-day sprint
          duration: 2,
          type: 'Development'
        });
        
        console.log('Sprint creation result:', sprintResult);
        
        if (sprintResult.success) {
          console.log('Sprint details:', {
            id: sprintResult.sprint.id,
            name: sprintResult.sprint.name,
            startDate: sprintResult.sprint.startDate,
            endDate: sprintResult.sprint.endDate
          });
          
          // Navigate to capacity planning
          const appElement = document.querySelector('[x-data*="sprintApp"]');
          const appData = Alpine.$data(appElement);
          appData.planSprintCapacity(sprintResult.sprint.id);
          
          return {
            success: true,
            sprintId: sprintResult.sprint.id,
            sprintData: sprintResult.sprint
          };
        }
      }
      
      return { success: false };
    });
    
    if (!setupResult.success) {
      console.log('❌ Test setup failed');
      return;
    }
    
    console.log('✅ Test data created, monitoring date generation...');
    
    // Wait for initialization
    await page.waitForTimeout(6000);
    
    // Check the final state
    const finalState = await page.evaluate(() => {
      const container = document.getElementById('capacityPlannerContainer');
      const activityContainers = container ? container.querySelectorAll('.activity-capacity-cell-container') : [];
      
      // Get Alpine component data
      const alpineElement = container ? container.querySelector('[x-data="capacityPlannerComponent()"]') : null;
      let alpineData = null;
      
      if (alpineElement) {
        try {
          alpineData = Alpine.$data(alpineElement);
        } catch (e) {
          console.log('Error accessing Alpine data:', e);
        }
      }
      
      return {
        hasContainer: !!container,
        activityContainerCount: activityContainers.length,
        hasAlpineElement: !!alpineElement,
        alpineData: alpineData ? {
          currentSprintId: alpineData.currentSprintId,
          availableSprints: alpineData.availableSprints.length,
          planningDates: alpineData.planningDates.length,
          planningTeamMembers: alpineData.planningTeamMembers.length,
          viewMode: alpineData.viewMode
        } : null
      };
    });
    
    console.log('\n📊 Date Generation Fix Results:');
    console.log('Has container:', finalState.hasContainer);
    console.log('Activity containers:', finalState.activityContainerCount);
    console.log('Alpine data:', finalState.alpineData);
    
    const isFixed = finalState.alpineData && finalState.alpineData.planningDates > 0 && finalState.activityContainerCount > 0;
    
    console.log('\n🎯 Date Generation Fix:');
    console.log(isFixed ? '✅ FIXED - Dates are now being generated!' : '❌ Still broken - No dates generated');
    
    await page.screenshot({ path: 'date-generation-fix.png', fullPage: true });
    console.log('\n📸 Screenshot saved: date-generation-fix.png');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testDateGenerationFix();
