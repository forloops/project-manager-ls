const { chromium } = require('playwright');

async function debugAlpineData() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:62080');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    await page.waitForTimeout(2000);
    
    // Create test data
    const testSetup = await page.evaluate(() => {
      // Create team member
      if (window.teamManager) {
        const memberResult = window.teamManager.createTeamMember({
          name: 'Alpine Test User',
          role: 'Developer',
          email: 'alpine@test.com',
          defaultCapacity: 8
        });
        console.log('Team member creation:', memberResult);
      }
      
      // Create sprint
      if (window.sprintManager) {
        const sprintResult = window.sprintManager.createSprint({
          name: 'Alpine Test Sprint',
          startDate: '2025-08-20',
          duration: 2,
          type: 'Development'
        });
        console.log('Sprint creation:', sprintResult);
        
        if (sprintResult.success) {
          // Switch to planner view
          const appElement = document.querySelector('[x-data*="sprintApp"]');
          const appData = Alpine.$data(appElement);
          appData.planSprintCapacity(sprintResult.sprint.id);
          
          return {
            success: true,
            sprintId: sprintResult.sprint.id,
            teamMembers: window.teamManager.getActiveTeamMembers(),
            sprint: sprintResult.sprint
          };
        }
      }
      
      return { success: false };
    });
    
    console.log('\\nTest setup result:', JSON.stringify(testSetup, null, 2));
    
    await page.waitForTimeout(1000);
    
    // Debug the Alpine component data
    const alpineComponentData = await page.evaluate(() => {
      const plannerElement = document.querySelector('[x-data="capacityPlannerComponent()"]');
      if (!plannerElement || !Alpine) {
        return { error: 'Planner element or Alpine not found' };
      }
      
      const componentData = Alpine.$data(plannerElement);
      
      return {
        currentSprintId: componentData.currentSprintId,
        viewMode: componentData.viewMode,
        availableSprints: componentData.availableSprints.length,
        planningDates: componentData.planningDates.length,
        planningTeamMembers: componentData.planningTeamMembers.length,
        hasUnsavedChanges: componentData.hasUnsavedChanges,
        
        // Check the actual data
        sprints: componentData.availableSprints.map(s => ({ id: s.id, name: s.name })),
        dates: componentData.planningDates.slice(0, 3), // First 3 dates
        members: componentData.planningTeamMembers.map(m => ({ id: m.id, name: m.name, role: m.role }))
      };
    });
    
    console.log('\\nAlpine component data:', JSON.stringify(alpineComponentData, null, 2));
    
    // Check if the component's methods work
    const methodsTest = await page.evaluate(() => {
      const plannerElement = document.querySelector('[x-data="capacityPlannerComponent()"]');
      if (!plannerElement || !Alpine) {
        return { error: 'Cannot test methods' };
      }
      
      const componentData = Alpine.$data(plannerElement);
      
      try {
        // Test loadData method
        componentData.loadData();
        
        // Test updatePlanner method
        componentData.updatePlanner();
        
        return {
          success: true,
          afterLoadData: {
            sprints: componentData.availableSprints.length,
            currentSprintId: componentData.currentSprintId
          },
          afterUpdatePlanner: {
            dates: componentData.planningDates.length,
            members: componentData.planningTeamMembers.length
          }
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    });
    
    console.log('\\nMethods test result:', JSON.stringify(methodsTest, null, 2));
    
    // Check if the HTML template is rendering properly
    const templateAnalysis = await page.evaluate(() => {
      const container = document.getElementById('capacityPlannerContainer');
      if (!container) return { error: 'Container not found' };
      
      return {
        hasSelectElements: container.querySelectorAll('select').length,
        hasTeamMemberRows: container.innerHTML.includes('planningTeamMembers'),
        hasDateHeaders: container.innerHTML.includes('planningDates'),
        hasAlpineDirectives: container.innerHTML.includes('x-for'),
        visibleContent: container.offsetHeight > 0 && container.offsetWidth > 0,
        containerDimensions: {
          height: container.offsetHeight,
          width: container.offsetWidth
        }
      };
    });
    
    console.log('\\nTemplate analysis:', JSON.stringify(templateAnalysis, null, 2));
    
    await page.screenshot({ path: 'alpine-data-debug.png', fullPage: true });
    console.log('\\nScreenshot saved: alpine-data-debug.png');
    
  } catch (error) {
    console.error('Debug error:', error);
    await page.screenshot({ path: 'alpine-data-error.png' });
  } finally {
    await browser.close();
  }
}

debugAlpineData();