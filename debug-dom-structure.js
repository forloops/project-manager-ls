const { chromium } = require('playwright');

async function debugDOMStructure() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:62080');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    await page.waitForTimeout(2000);
    
    // Create test data and switch to planner view
    await page.evaluate(() => {
      if (window.teamManager) {
        window.teamManager.createTeamMember({
          name: 'DOM Test User',
          role: 'Developer',
          email: 'dom@test.com',
          defaultCapacity: 8
        });
      }
      
      if (window.sprintManager) {
        const sprintResult = window.sprintManager.createSprint({
          name: 'DOM Test Sprint',
          startDate: '2025-08-20',
          duration: 2,
          type: 'Development'
        });
        
        if (sprintResult.success) {
          const appElement = document.querySelector('[x-data*="sprintApp"]');
          const appData = Alpine.$data(appElement);
          appData.planSprintCapacity(sprintResult.sprint.id);
        }
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Analyze the DOM structure for capacity planning views
    const domAnalysis = await page.evaluate(() => {
      const overview = document.querySelector('[x-show="capacityViewMode === \'overview\'"]');
      const planner = document.querySelector('[x-show="capacityViewMode === \'planner\'"]');
      const plannerContainer = document.getElementById('capacityPlannerContainer');
      
      const result = {
        overview: {
          exists: !!overview,
          display: overview?.style.display,
          zIndex: overview ? getComputedStyle(overview).zIndex : null,
          position: overview ? getComputedStyle(overview).position : null,
          innerHTML: overview ? overview.innerHTML.substring(0, 200) + '...' : null
        },
        planner: {
          exists: !!planner,
          display: planner?.style.display,
          zIndex: planner ? getComputedStyle(planner).zIndex : null,
          position: planner ? getComputedStyle(planner).position : null,
          innerHTML: planner ? planner.innerHTML.substring(0, 200) + '...' : null
        },
        plannerContainer: {
          exists: !!plannerContainer,
          innerHTML: plannerContainer ? plannerContainer.innerHTML.substring(0, 300) + '...' : null,
          hasInteractivePlanner: plannerContainer ? plannerContainer.innerHTML.includes('Interactive Capacity Planner') : false,
          hasActivityCells: plannerContainer ? plannerContainer.querySelectorAll('.activity-capacity-cell-container').length : 0
        }
      };
      
      // Check if elements are overlapping
      if (overview && planner) {
        const overviewRect = overview.getBoundingClientRect();
        const plannerRect = planner.getBoundingClientRect();
        
        result.overlap = {
          overviewRect: {
            top: overviewRect.top,
            left: overviewRect.left,
            width: overviewRect.width,
            height: overviewRect.height
          },
          plannerRect: {
            top: plannerRect.top,
            left: plannerRect.left,
            width: plannerRect.width,
            height: plannerRect.height
          }
        };
      }
      
      return result;
    });
    
    console.log('\\nDOM Analysis:', JSON.stringify(domAnalysis, null, 2));
    
    // Try to scroll to and highlight the planner section
    await page.evaluate(() => {
      const planner = document.querySelector('[x-show="capacityViewMode === \'planner\'"]');
      if (planner) {
        planner.style.backgroundColor = 'yellow';
        planner.style.border = '3px solid red';
        planner.scrollIntoView({ behavior: 'smooth' });
      }
    });
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'dom-structure-debug.png', fullPage: true });
    console.log('\\nScreenshot with highlighted planner: dom-structure-debug.png');
    
    // Check the actual content of the capacity planner container
    const plannerContent = await page.evaluate(() => {
      const container = document.getElementById('capacityPlannerContainer');
      if (!container) return { error: 'Container not found' };
      
      return {
        hasHTML: container.innerHTML.length > 0,
        hasCapacityPlanner: container.innerHTML.includes('capacity-planner'),
        hasInteractiveHeader: container.innerHTML.includes('Interactive Capacity Planner'),
        hasAlpineData: container.innerHTML.includes('x-data'),
        hasActivityCellContainers: container.querySelectorAll('.activity-capacity-cell-container').length,
        actualContent: container.innerHTML
      };
    });
    
    console.log('\\nPlanner container content analysis:');
    console.log('Has HTML:', plannerContent.hasHTML);
    console.log('Has capacity-planner class:', plannerContent.hasCapacityPlanner);
    console.log('Has Interactive header:', plannerContent.hasInteractiveHeader);
    console.log('Has Alpine data:', plannerContent.hasAlpineData);
    console.log('Activity cell containers:', plannerContent.hasActivityCellContainers);
    
    if (plannerContent.actualContent) {
      console.log('\\nActual content (first 500 chars):');
      console.log(plannerContent.actualContent.substring(0, 500));
    }
    
  } catch (error) {
    console.error('Debug error:', error);
    await page.screenshot({ path: 'dom-debug-error.png' });
  } finally {
    await browser.close();
  }
}

debugDOMStructure();