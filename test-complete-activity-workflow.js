const { chromium } = require('playwright');

async function testCompleteActivityWorkflow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    await page.waitForTimeout(2000);
    
    // Create test data
    const setupResult = await page.evaluate(() => {
      // Create team member
      if (window.teamManager) {
        window.teamManager.createTeamMember({
          name: 'Complete Test User',
          role: 'Developer',
          email: 'complete@example.com',
          defaultCapacity: 8
        });
      }
      
      // Create sprint
      if (window.sprintManager) {
        const sprintResult = window.sprintManager.createSprint({
          name: 'Complete Activity Sprint',
          startDate: '2025-08-20',
          duration: 2,
          type: 'Development'
        });
        
        if (sprintResult.success) {
          // Navigate to capacity planning and switch to planner view
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
    
    console.log('✅ Test data created');
    await page.waitForTimeout(3000);
    
    // Navigate to Capacity Planning tab
    await page.click('a[href="#capacity-planning"]');
    await page.waitForTimeout(1000);
    
    // Switch to Interactive Planner view
    await page.evaluate(() => {
      const dashboardElement = document.querySelector('[x-data="capacityDashboardComponent()"]');
      if (dashboardElement) {
        const dashboardData = Alpine.$data(dashboardElement);
        dashboardData.viewMode = 'planner';
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Check if the Interactive Capacity Planner is visible
    const plannerVisibility = await page.evaluate(() => {
      const plannerSection = document.querySelector('[x-show="capacityViewMode === \'planner\'"]');
      const plannerContainer = document.getElementById('capacityPlannerContainer');
      
      return {
        plannerSectionExists: !!plannerSection,
        plannerSectionVisible: plannerSection ? getComputedStyle(plannerSection).display !== 'none' : false,
        plannerContainerExists: !!plannerContainer,
        plannerContainerHTML: plannerContainer ? plannerContainer.innerHTML.substring(0, 300) : 'No container',
        hasInteractivePlannerTitle: plannerContainer ? plannerContainer.innerHTML.includes('Interactive Capacity Planner') : false
      };
    });
    
    console.log('\n📊 Planner Visibility:');
    console.log('Planner section exists:', plannerVisibility.plannerSectionExists);
    console.log('Planner section visible:', plannerVisibility.plannerSectionVisible);
    console.log('Planner container exists:', plannerVisibility.plannerContainerExists);
    console.log('Has Interactive Planner title:', plannerVisibility.hasInteractivePlannerTitle);
    
    // Check activity containers and components
    const activityStatus = await page.evaluate(() => {
      const container = document.getElementById('capacityPlannerContainer');
      const activityContainers = container ? container.querySelectorAll('.activity-capacity-cell-container') : [];
      const activityCells = container ? container.querySelectorAll('.activity-capacity-cell') : [];
      
      return {
        activityContainerCount: activityContainers.length,
        activityCellCount: activityCells.length,
        firstContainerData: activityContainers.length > 0 ? {
          memberId: activityContainers[0].dataset.memberId,
          date: activityContainers[0].dataset.date,
          hasActivityCell: !!activityContainers[0]._activityCell
        } : null
      };
    });
    
    console.log('\n🔧 Activity Status:');
    console.log('Activity containers:', activityStatus.activityContainerCount);
    console.log('Activity cells:', activityStatus.activityCellCount);
    console.log('First container data:', activityStatus.firstContainerData);
    
    // Try to click on an activity cell to test interaction
    const interactionResult = await page.evaluate(() => {
      const activityContainers = document.querySelectorAll('.activity-capacity-cell-container');
      if (activityContainers.length > 0) {
        const firstContainer = activityContainers[0];
        const clickEvent = new MouseEvent('click', { bubbles: true });
        firstContainer.dispatchEvent(clickEvent);
        
        return {
          clicked: true,
          containerHTML: firstContainer.innerHTML.substring(0, 200)
        };
      }
      return { clicked: false, reason: 'No activity containers found' };
    });
    
    console.log('\n🖱️  Interaction Test:');
    console.log('Clicked activity container:', interactionResult.clicked);
    if (interactionResult.containerHTML) {
      console.log('Container HTML preview:', interactionResult.containerHTML);
    }
    
    await page.screenshot({ path: 'complete-activity-workflow.png', fullPage: true });
    console.log('\n📸 Screenshot saved: complete-activity-workflow.png');
    
    // Final summary
    const isFullyWorking = plannerVisibility.hasInteractivePlannerTitle && 
                          activityStatus.activityContainerCount > 0 &&
                          interactionResult.clicked;
    
    console.log('\n🎯 Final Result:');
    console.log(isFullyWorking ? '✅ Multi-activity functionality is WORKING!' : '❌ Multi-activity functionality needs more work');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    await page.screenshot({ path: 'complete-activity-error.png' });
  } finally {
    await browser.close();
  }
}

testCompleteActivityWorkflow();
