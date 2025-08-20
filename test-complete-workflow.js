const { chromium } = require('playwright');

async function testCompleteWorkflow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    let jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:58198');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    // Step 1: Add a team member
    console.log('\\n=== Step 1: Add Team Member ===');
    await page.click('text=Team Management');
    await page.waitForTimeout(1000);
    
    await page.click('text=Add Your First Team Member');
    await page.waitForTimeout(500);
    
    await page.fill('input[name="name"], input[placeholder*="name"]', 'John Developer');
    await page.selectOption('select[name="role"], select', 'Developer');
    
    await page.click('button:has-text("Add Member")');
    await page.waitForTimeout(1000);
    console.log('✅ Team member added');
    
    // Step 2: Create a sprint  
    console.log('\\n=== Step 2: Create Sprint ===');
    await page.click('text=Sprints');
    await page.waitForTimeout(1000);
    
    await page.click('text=Create Your First Sprint');
    await page.waitForTimeout(500);
    
    await page.fill('input[name="name"], input[placeholder*="Sprint"]', 'Multi-Activity Test Sprint');
    await page.fill('input[type="date"]', '2025-08-20');
    
    await page.click('button:has-text("Create Sprint")');
    await page.waitForTimeout(2000);
    console.log('✅ Sprint created');
    
    // Step 3: Navigate to Capacity Planning and look for Plan Capacity button
    console.log('\\n=== Step 3: Access Capacity Planning ===');
    await page.click('text=Capacity Planning');
    await page.waitForTimeout(2000);
    
    // Look for the Plan Capacity button on the sprint card
    const planCapacityButton = page.locator('button:has-text("Plan Capacity")');
    if (await planCapacityButton.isVisible({ timeout: 5000 })) {
      console.log('✅ Plan Capacity button found');
      
      // Step 4: Click Plan Capacity to access the interactive planner
      console.log('\\n=== Step 4: Access Interactive Capacity Planner ===');
      await planCapacityButton.click();
      await page.waitForTimeout(3000);
      
      // Check if Interactive Capacity Planner appeared
      const interactivePlanner = page.locator('text=Interactive Capacity Planner');
      if (await interactivePlanner.isVisible({ timeout: 3000 })) {
        console.log('✅ Interactive Capacity Planner loaded');
        
        // Step 5: Check for ActivityCapacityCell components
        console.log('\\n=== Step 5: Check Activity Cell Integration ===');
        
        const cellContainers = await page.locator('.activity-capacity-cell-container').count();
        console.log(`Found ${cellContainers} activity capacity cell containers`);
        
        const actualCells = await page.locator('.activity-capacity-cell').count();
        console.log(`Found ${actualCells} actual activity capacity cells`);
        
        if (actualCells > 0) {
          console.log('✅ Activity capacity cells found!');
          
          // Step 6: Try to interact with an activity cell
          console.log('\\n=== Step 6: Test Activity Cell Interaction ===');
          
          const firstCell = page.locator('.activity-capacity-cell').first();
          
          // Look for Add Activity button or switch to activities button
          const addActivityBtn = page.locator('button:has-text("Add Activity"), button:has-text("+ Add"), .add-activity').first();
          const switchToActivitiesBtn = page.locator('button:has-text("Switch to activities")').first();
          
          if (await addActivityBtn.isVisible({ timeout: 2000 })) {
            console.log('✅ Add Activity button found');
            await addActivityBtn.click();
            await page.waitForTimeout(1000);
            
            // Check if activity modal opened
            const activityModal = page.locator('.activity-modal, .modal-header:has-text("Add Activity")');
            if (await activityModal.isVisible({ timeout: 2000 })) {
              console.log('🎉 Activity Modal opened! Multi-activity feature is working!');
              
              // Fill out the activity form
              await page.fill('input[name="name"], .activity-name', 'Feature Development');
              await page.selectOption('select[name="type"], .activity-type', 'development');
              await page.fill('input[name="capacity"], .activity-capacity', '4');
              
              await page.click('button:has-text("Save Activity")');
              await page.waitForTimeout(1000);
              
              console.log('✅ Activity added successfully');
            } else {
              console.log('❌ Activity modal did not open');
            }
          } else if (await switchToActivitiesBtn.isVisible({ timeout: 2000 })) {
            console.log('✅ Switch to activities button found');
            await switchToActivitiesBtn.click();
            await page.waitForTimeout(1000);
            console.log('✅ Switched to activity mode');
          } else {
            console.log('❌ No activity interaction buttons found');
            
            // Try clicking on the cell itself
            await firstCell.click();
            await page.waitForTimeout(1000);
            console.log('ℹ️  Clicked on activity cell');
          }
        } else {
          console.log('❌ No activity capacity cells rendered');
          
          // Check what we do have
          const basicInputs = await page.locator('input[type="number"]').count();
          console.log(`Found ${basicInputs} basic input fields instead`);
        }
        
      } else {
        console.log('❌ Interactive Capacity Planner did not load');
      }
    } else {
      console.log('❌ Plan Capacity button not found');
      
      // Check what capacity planning interface is showing
      const capacityText = await page.textContent('.capacity-planning, [data-view="capacity-planning"], #capacityPlanningContainer');
      console.log('Current capacity interface:', capacityText?.substring(0, 200) + '...');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'complete-workflow-test.png', fullPage: true });
    console.log('\\nScreenshot saved: complete-workflow-test.png');
    
    if (jsErrors.length > 0) {
      console.log('\\n❌ JavaScript errors:');
      jsErrors.forEach(error => console.log(`  ${error}`));
    } else {
      console.log('\\n✅ No JavaScript errors detected');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'workflow-error.png' });
  } finally {
    await browser.close();
  }
}

testCompleteWorkflow();