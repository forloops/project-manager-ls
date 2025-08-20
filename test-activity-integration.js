const { chromium } = require('playwright');

async function testActivityIntegration() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    let jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      } else if (msg.type() === 'log') {
        console.log('Browser log:', msg.text());
      }
    });
    
    await page.goto('http://localhost:58198');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    // Navigate to Capacity Planning
    await page.click('text=Capacity Planning');
    await page.waitForTimeout(1000);
    console.log('✅ Navigated to Capacity Planning');
    
    // First create a team member so we have someone to allocate capacity to
    await page.click('text=Team Management');
    await page.waitForTimeout(500);
    
    // Try to add a team member
    const addMemberButton = page.locator('text=Add Team Member, text=Add Your First Team Member').first();
    if (await addMemberButton.isVisible({ timeout: 3000 })) {
      await addMemberButton.click();
      await page.waitForTimeout(500);
      
      // Fill member details
      await page.fill('input[placeholder*="name"], input[name*="name"]', 'John Developer');
      await page.selectOption('select[name*="role"], select[placeholder*="role"]', 'Developer');
      
      const saveMemberButton = page.locator('button:has-text("Add Member"), button:has-text("Save")').first();
      if (await saveMemberButton.isVisible()) {
        await saveMemberButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Team member added');
      }
    }
    
    // Go back to Capacity Planning
    await page.click('text=Capacity Planning');
    await page.waitForTimeout(1000);
    
    // Create a sprint
    const createSprintButton = page.locator('text=Create Sprint, text=Create Your First Sprint').first();
    if (await createSprintButton.isVisible({ timeout: 3000 })) {
      await createSprintButton.click();
      await page.waitForTimeout(500);
      
      await page.fill('input[placeholder*="Sprint"], input[name*="name"]', 'Activity Test Sprint');
      await page.fill('input[type="date"]', '2025-08-20');
      
      // Save sprint - try clicking the actual save button in the modal
      await page.click('.modal-content button:has-text("Create Sprint"), .modal button:has-text("Create Sprint")');
      await page.waitForTimeout(2000);
      console.log('✅ Sprint created');
    }
    
    // Look for Plan Capacity or Interactive Capacity Planner
    await page.waitForTimeout(2000);
    
    const planCapacityButton = page.locator('text=Plan Capacity').first();
    if (await planCapacityButton.isVisible({ timeout: 5000 })) {
      await planCapacityButton.click();
      await page.waitForTimeout(3000);
      console.log('✅ Clicked Plan Capacity');
    } else {
      console.log('⚠️  Plan Capacity button not found, checking for Interactive Capacity Planner');
      
      const interactivePlanner = page.locator('text=Interactive Capacity Planner');
      if (await interactivePlanner.isVisible({ timeout: 3000 })) {
        console.log('✅ Interactive Capacity Planner found');
      } else {
        console.log('❌ No capacity planning interface found');
      }
    }
    
    // Check for ActivityCapacityCell containers
    await page.waitForTimeout(2000);
    
    const cellContainers = await page.locator('.activity-capacity-cell-container').count();
    console.log(`Found ${cellContainers} activity capacity cell containers`);
    
    const actualCells = await page.locator('.activity-capacity-cell').count();
    console.log(`Found ${actualCells} actual activity capacity cells`);
    
    // Check for basic capacity cells or inputs
    const basicCapacityInputs = await page.locator('input[type="number"]').count();
    console.log(`Found ${basicCapacityInputs} basic capacity input fields`);
    
    // Look for any clickable capacity-related elements
    const capacityCells = await page.locator('.capacity-cell').count();
    console.log(`Found ${capacityCells} capacity cells`);
    
    // Check if ActivityCapacityCell class is available
    const activityCellAvailable = await page.evaluate(() => {
      return typeof window.ActivityCapacityCell !== 'undefined';
    });
    console.log('ActivityCapacityCell class available:', activityCellAvailable);
    
    // Check for capacity planner manager
    const capacityPlannerAvailable = await page.evaluate(() => {
      return typeof window.capacityPlannerManager !== 'undefined';
    });
    console.log('Capacity Planner Manager available:', capacityPlannerAvailable);
    
    // Try to find any way to add activities
    const addButtons = await page.locator('button:has-text("Add"), button:has-text("+")').allTextContents();
    console.log('Available add buttons:', addButtons);
    
    // Check the current page content for activity-related elements
    const pageText = await page.textContent('body');
    const hasActivityText = pageText.includes('activity') || pageText.includes('Activity');
    console.log('Page contains activity-related text:', hasActivityText);
    
    // Take screenshot of current state
    await page.screenshot({ path: 'activity-integration-test.png', fullPage: true });
    console.log('Screenshot saved: activity-integration-test.png');
    
    if (jsErrors.length > 0) {
      console.log('\\n❌ JavaScript errors:');
      jsErrors.forEach(error => console.log(`  ${error}`));
    } else {
      console.log('\\n✅ No JavaScript errors detected');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'activity-test-error.png' });
  } finally {
    await browser.close();
  }
}

testActivityIntegration();