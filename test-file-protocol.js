const { chromium } = require('playwright');
const path = require('path');

async function testFileProtocol() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Get absolute path to index.html
    const indexPath = path.resolve('./index.html');
    const fileUrl = `file://${indexPath}`;
    
    console.log(`Opening: ${fileUrl}`);
    
    // Enable console logging
    page.on('console', msg => {
      console.log('BROWSER:', msg.text());
    });
    
    await page.goto(fileUrl);
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded from file:// protocol');
    
    await page.waitForTimeout(3000);
    
    // Create test data
    const setupResult = await page.evaluate(() => {
      console.log('Creating test data...');
      
      // Create team member
      if (window.teamManager) {
        const memberResult = window.teamManager.createTeamMember({
          name: 'File Protocol Test User',
          role: 'Developer',
          email: 'filetest@example.com',
          defaultCapacity: 8
        });
        console.log('Team member created:', memberResult.success);
      }
      
      // Create sprint
      if (window.sprintManager) {
        const sprintResult = window.sprintManager.createSprint({
          name: 'File Protocol Test Sprint',
          startDate: '2025-08-20',
          duration: 2,
          type: 'Development'
        });
        
        console.log('Sprint created:', sprintResult.success);
        
        if (sprintResult.success) {
          // Navigate to capacity planning
          const appElement = document.querySelector('[x-data*="sprintApp"]');
          const appData = Alpine.$data(appElement);
          console.log('Calling planSprintCapacity...');
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
    
    console.log('✅ Test data created, watching for multi-activity initialization...');
    
    // Wait for all initialization to complete
    await page.waitForTimeout(8000);
    
    // Check if multi-activity system is working
    const multiActivityStatus = await page.evaluate(() => {
      const container = document.getElementById('capacityPlannerContainer');
      const activityContainers = container ? container.querySelectorAll('.activity-capacity-cell-container') : [];
      const activityCells = container ? container.querySelectorAll('.activity-capacity-cell') : [];
      
      // Check Alpine component data
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
        activityCellCount: activityCells.length,
        hasAlpineElement: !!alpineElement,
        alpineData: alpineData ? {
          currentSprintId: alpineData.currentSprintId,
          availableSprints: alpineData.availableSprints.length,
          planningDates: alpineData.planningDates.length,
          planningTeamMembers: alpineData.planningTeamMembers.length
        } : null,
        containerHTML: container ? container.innerHTML.substring(0, 500) : 'No container'
      };
    });
    
    console.log('\n📊 Multi-Activity Status (File Protocol):');
    console.log('Has container:', multiActivityStatus.hasContainer);
    console.log('Activity containers:', multiActivityStatus.activityContainerCount);
    console.log('Activity cells:', multiActivityStatus.activityCellCount);
    console.log('Has Alpine element:', multiActivityStatus.hasAlpineElement);
    console.log('Alpine data:', multiActivityStatus.alpineData);
    
    // Test interaction
    if (multiActivityStatus.activityContainerCount > 0) {
      console.log('\n🖱️  Testing activity cell interaction...');
      const interactionResult = await page.evaluate(() => {
        const firstContainer = document.querySelector('.activity-capacity-cell-container');
        if (firstContainer) {
          firstContainer.click();
          return { clicked: true, memberId: firstContainer.dataset.memberId, date: firstContainer.dataset.date };
        }
        return { clicked: false };
      });
      
      console.log('Interaction result:', interactionResult);
    }
    
    await page.screenshot({ path: 'file-protocol-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved: file-protocol-test.png');
    
    const isWorking = multiActivityStatus.activityContainerCount > 0;
    console.log('\n🎯 Final Result:');
    console.log(isWorking ? '✅ Multi-activity functionality WORKS with file:// protocol!' : '❌ Multi-activity functionality NOT working with file:// protocol');
    
    if (!isWorking) {
      console.log('\n🔍 Container HTML preview:');
      console.log(multiActivityStatus.containerHTML);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'file-protocol-error.png' });
  } finally {
    await browser.close();
  }
}

testFileProtocol();
