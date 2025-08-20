const { chromium } = require('playwright');

async function testCapacityCells() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    let jsErrors = [];
    let consoleMessages = [];
    
    page.on('console', msg => {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`);
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:62080');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    // First create a team member
    console.log('\\n=== Step 1: Create Team Member ===');
    await page.click('text=Team Management');
    await page.waitForTimeout(1000);
    
    await page.click('text=Add Your First Team Member');
    await page.waitForTimeout(500);
    
    await page.fill('input[x-model="teamMemberForm.name"]', 'Alice Developer');
    await page.selectOption('select[x-model="teamMemberForm.role"]', 'Developer');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    console.log('✅ Team member created');
    
    // Create a sprint
    console.log('\\n=== Step 2: Create Sprint ===');
    await page.click('text=Sprints');
    await page.waitForTimeout(1000);
    
    await page.click('text=Create Your First Sprint');
    await page.waitForTimeout(500);
    
    await page.fill('input[x-model="sprintForm.name"]', 'Activity Test Sprint');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1500);
    console.log('✅ Sprint created');
    
    // Go to Capacity Planning
    console.log('\\n=== Step 3: Access Capacity Planning ===');
    await page.click('text=Capacity Planning');
    await page.waitForTimeout(2000);
    
    // Look for Plan Capacity button
    const planCapacityBtn = page.locator('button:has-text("Plan Capacity")');
    if (await planCapacityBtn.isVisible({ timeout: 3000 })) {
      console.log('✅ Plan Capacity button found');
      
      // Click to open Interactive Capacity Planner
      await planCapacityBtn.click();
      await page.waitForTimeout(3000);
      
      console.log('\\n=== Step 4: Analyze Interactive Capacity Planner ===');
      
      // Check if Interactive Capacity Planner loaded
      const interactivePlanner = page.locator('text=Interactive Capacity Planner');
      if (await interactivePlanner.isVisible({ timeout: 2000 })) {
        console.log('✅ Interactive Capacity Planner loaded');
        
        // Check for capacity cell containers
        const cellContainers = await page.locator('.activity-capacity-cell-container').count();
        console.log(`Found ${cellContainers} activity capacity cell containers`);
        
        // Check for actual ActivityCapacityCell components
        const activityCells = await page.locator('.activity-capacity-cell').count();
        console.log(`Found ${activityCells} actual activity capacity cells`);
        
        // Check for basic input fields (fallback)
        const basicInputs = await page.locator('input[type="number"]').count();
        console.log(`Found ${basicInputs} basic number inputs`);
        
        // Check if initializeActivityCells was called
        const initLogs = consoleMessages.filter(msg => 
          msg.includes('initializeActivityCells') || 
          msg.includes('ActivityCapacityCell') ||
          msg.includes('activity-capacity-cell')
        );
        
        if (initLogs.length > 0) {
          console.log('\\nActivity cell initialization logs:');
          initLogs.forEach(log => console.log(`  ${log}`));
        } else {
          console.log('❌ No activity cell initialization logs found');
        }
        
        // Check what's actually in the capacity cells
        if (cellContainers > 0) {
          const firstContainer = page.locator('.activity-capacity-cell-container').first();
          const containerContent = await firstContainer.textContent();
          console.log(`\\nFirst container content: "${containerContent}"`);
          
          // Check for activity-related buttons or elements
          const addActivityBtns = await page.locator('button:has-text("Add Activity"), .add-activity').count();
          const switchToActivitiesBtns = await page.locator('button:has-text("Switch to activities")').count();
          
          console.log(`Add Activity buttons: ${addActivityBtns}`);
          console.log(`Switch to Activities buttons: ${switchToActivitiesBtns}`);
          
          if (addActivityBtns === 0 && switchToActivitiesBtns === 0) {
            console.log('❌ No activity interaction buttons found - ActivityCapacityCell not rendering');
          } else {
            console.log('✅ Activity interaction buttons found');
          }
        }
        
        // Take a screenshot of the capacity planner
        await page.screenshot({ path: 'capacity-planner-analysis.png', fullPage: true });
        console.log('\\nScreenshot saved: capacity-planner-analysis.png');
        
      } else {
        console.log('❌ Interactive Capacity Planner did not load');
      }
    } else {
      console.log('❌ Plan Capacity button not found');
      
      // Take screenshot to see current state
      await page.screenshot({ path: 'no-plan-capacity-button.png', fullPage: true });
    }
    
    console.log('\\n=== Summary ===');
    if (jsErrors.length > 0) {
      console.log('JavaScript errors:');
      jsErrors.forEach(error => console.log(`❌ ${error}`));
    } else {
      console.log('✅ No JavaScript errors');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'capacity-test-error.png' });
  } finally {
    await browser.close();
  }
}

testCapacityCells();