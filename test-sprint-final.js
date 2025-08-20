const { chromium } = require('playwright');

async function testSprintFinal() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    let jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:54219');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    // Go to Sprints tab
    await page.click('text=Sprints');
    await page.waitForTimeout(1000);
    
    // Click Create Sprint
    await page.click('text=Create Your First Sprint');
    await page.waitForTimeout(1000);
    console.log('✅ Sprint creation modal opened');
    
    // Fill the form using the Alpine model selectors
    await page.fill('input[x-model="sprintForm.name"]', 'Final Test Sprint');
    await page.waitForTimeout(500);
    
    // Use the button inside the modal, not the one outside
    const modalSubmitButton = page.locator('.modal-content button:has-text("Create Sprint"), .modal button:has-text("Create Sprint")').last();
    
    console.log('✅ Form filled, clicking submit button inside modal...');
    await modalSubmitButton.click();
    await page.waitForTimeout(3000);
    
    // Check if modal closed and sprint was created
    const modalVisible = await page.isVisible('[x-show="showCreateSprintModal"]');
    console.log('Modal still visible after submit:', modalVisible);
    
    if (!modalVisible) {
      console.log('🎉 SUCCESS: Sprint created and modal closed!');
      
      // Check if sprint appears in the list
      const sprintCards = await page.locator('.sprint-card, [data-sprint]').count();
      console.log(`Found ${sprintCards} sprint cards in the interface`);
      
      if (sprintCards > 0) {
        console.log('✅ Sprint card found');
        
        // Now let's test the Plan Capacity workflow
        console.log('\\n=== Testing Plan Capacity Workflow ===');
        
        // First add a team member
        await page.click('text=Team Management');
        await page.waitForTimeout(1000);
        
        await page.click('text=Add Your First Team Member');
        await page.waitForTimeout(500);
        
        await page.fill('input[x-model="teamMemberForm.name"]', 'John Developer');
        await page.selectOption('select[x-model="teamMemberForm.role"]', 'Developer');
        
        const addMemberButton = page.locator('.modal button:has-text("Add Member")').last();
        await addMemberButton.click();
        await page.waitForTimeout(1000);
        console.log('✅ Team member added');
        
        // Go back to Capacity Planning
        await page.click('text=Capacity Planning');
        await page.waitForTimeout(2000);
        
        // Look for Plan Capacity button
        const planCapacityButton = page.locator('button:has-text("Plan Capacity")');
        if (await planCapacityButton.isVisible({ timeout: 3000 })) {
          console.log('✅ Plan Capacity button found');
          
          await planCapacityButton.click();
          await page.waitForTimeout(3000);
          
          // Check if Interactive Capacity Planner loaded
          const interactivePlanner = page.locator('text=Interactive Capacity Planner');
          if (await interactivePlanner.isVisible({ timeout: 3000 })) {
            console.log('🎉 SUCCESS: Interactive Capacity Planner loaded!');
            
            // Check for activity capacity cells
            const activityCells = await page.locator('.activity-capacity-cell-container').count();
            console.log(`Found ${activityCells} activity capacity cell containers`);
            
            if (activityCells > 0) {
              console.log('🚀 MULTI-ACTIVITY FEATURE READY: Activity cells are present!');
            } else {
              console.log('⚠️  Activity cells not found - may need more debugging');
            }
          } else {
            console.log('❌ Interactive Capacity Planner did not load');
          }
        } else {
          console.log('❌ Plan Capacity button not found');
        }
      }
    } else {
      console.log('❌ Sprint creation failed - modal still open');
    }
    
    await page.screenshot({ path: 'sprint-final-test.png', fullPage: true });
    console.log('Final screenshot saved: sprint-final-test.png');
    
    if (jsErrors.length > 0) {
      console.log('\\n❌ JavaScript errors:');
      jsErrors.forEach(error => console.log(`  ${error}`));
    } else {
      console.log('\\n✅ No JavaScript errors detected');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'final-test-error.png' });
  } finally {
    await browser.close();
  }
}

testSprintFinal();