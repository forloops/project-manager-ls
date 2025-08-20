const { chromium } = require('playwright');

async function testSprintCreation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    let jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      } else if (msg.type() === 'log') {
        console.log('Browser:', msg.text());
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
    await page.waitForTimeout(500);
    console.log('✅ Sprint creation modal opened');
    
    // Fill in sprint details
    await page.fill('input[name="name"], input[placeholder*="Sprint"]', 'Duration Test Sprint');
    await page.fill('input[type="date"]', '2025-08-20');
    
    // Check the duration dropdown value
    const durationValue = await page.inputValue('select[x-model="sprintForm.duration"]');
    console.log('Current duration value:', durationValue);
    
    // Explicitly select a duration
    await page.selectOption('select[x-model="sprintForm.duration"]', '2');
    await page.waitForTimeout(500);
    
    const updatedDurationValue = await page.inputValue('select[x-model="sprintForm.duration"]');
    console.log('Updated duration value:', updatedDurationValue);
    
    console.log('✅ Form filled, attempting to create sprint...');
    
    // Click Create Sprint button
    await page.click('button:has-text("Create Sprint")');
    await page.waitForTimeout(2000);
    
    // Check if modal closed (indicating success) or error appeared
    const modalVisible = await page.isVisible('.modal, [x-show="showCreateSprintModal"]');
    console.log('Modal still visible after submit:', modalVisible);
    
    if (!modalVisible) {
      console.log('🎉 Sprint created successfully! Modal closed.');
      
      // Check if sprint appears in the list
      const sprintCards = await page.locator('.sprint-card, [data-sprint]').count();
      console.log(`Found ${sprintCards} sprint cards`);
      
      if (sprintCards > 0) {
        console.log('✅ Sprint card found in the interface');
        
        // Look for the Plan Capacity button
        const planCapacityButton = page.locator('button:has-text("Plan Capacity")');
        if (await planCapacityButton.isVisible({ timeout: 2000 })) {
          console.log('✅ Plan Capacity button is available');
        } else {
          console.log('❌ Plan Capacity button not found');
        }
      }
    } else {
      console.log('❌ Sprint creation failed - modal still open');
      
      // Check for error messages
      const errorElements = await page.locator('.error, .text-red-500, .text-red-600, .text-red-700').allTextContents();
      if (errorElements.length > 0) {
        console.log('Error messages found:', errorElements);
      }
      
      // Take screenshot of the error state
      await page.screenshot({ path: 'sprint-creation-error.png' });
      console.log('Error screenshot saved: sprint-creation-error.png');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'sprint-creation-result.png', fullPage: true });
    console.log('Result screenshot saved: sprint-creation-result.png');
    
    if (jsErrors.length > 0) {
      console.log('\\n❌ JavaScript errors:');
      jsErrors.forEach(error => console.log(`  ${error}`));
    } else {
      console.log('\\n✅ No JavaScript errors detected');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
  }
}

testSprintCreation();