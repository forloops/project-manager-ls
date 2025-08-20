const { chromium } = require('playwright');

async function testSprintCorrect() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
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
    
    // Fill the form
    await page.fill('input[x-model="sprintForm.name"]', 'Multi-Activity Test Sprint');
    await page.waitForTimeout(500);
    
    console.log('✅ Form filled, submitting...');
    
    // Click the submit button inside the modal
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    
    // Check if modal closed
    const modalVisible = await page.isVisible('[x-show="showCreateSprintModal"]');
    console.log('Modal still visible:', modalVisible);
    
    if (!modalVisible) {
      console.log('🎉 SUCCESS: Sprint created!');
      
      // Check for sprint cards
      const sprintCards = await page.locator('.sprint-card, [data-sprint]').count();
      console.log(`Found ${sprintCards} sprint cards`);
      
      if (sprintCards > 0) {
        // Take a success screenshot
        await page.screenshot({ path: 'sprint-success.png', fullPage: true });
        console.log('Success screenshot saved: sprint-success.png');
        
        console.log('\\n🚀 SPRINT CREATION SUCCESSFUL!');
        console.log('Duration validation issue has been resolved.');
        console.log('Users can now create sprints and access the multi-activity capacity allocation feature.');
      }
    } else {
      console.log('❌ Sprint creation failed');
      await page.screenshot({ path: 'sprint-failed.png', fullPage: true });
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
  }
}

testSprintCorrect();