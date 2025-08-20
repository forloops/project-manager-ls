const { chromium } = require('playwright');

async function testSprintOverlap() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    let jsErrors = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:59115');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    // Go to Sprints tab
    await page.click('text=Sprints');
    await page.waitForTimeout(1000);
    
    // Create first sprint
    console.log('\\n=== Creating First Sprint ===');
    await page.click('text=Create Your First Sprint');
    await page.waitForTimeout(500);
    
    await page.fill('input[x-model="sprintForm.name"]', 'Sprint 1');
    await page.fill('input[x-model="sprintForm.startDate"]', '2025-08-01');
    // This should auto-calculate end date as 2025-08-14 for 2-week sprint
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Check if first sprint was created successfully
    let modalVisible = await page.isVisible('[x-show="showCreateSprintModal"]');
    if (!modalVisible) {
      console.log('✅ First sprint created successfully');
    } else {
      console.log('❌ First sprint creation failed');
      await page.screenshot({ path: 'sprint1-error.png' });
    }
    
    // Create second sprint that should NOT overlap (starts after first ends)
    console.log('\\n=== Creating Adjacent Sprint (Should Work) ===');
    await page.click('text=Create Sprint');
    await page.waitForTimeout(500);
    
    await page.fill('input[x-model="sprintForm.name"]', 'Sprint 2 - Adjacent');
    await page.fill('input[x-model="sprintForm.startDate"]', '2025-08-15'); // Day after first sprint ends
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    modalVisible = await page.isVisible('[x-show="showCreateSprintModal"]');
    if (!modalVisible) {
      console.log('✅ Adjacent sprint created successfully (no false overlap detected)');
    } else {
      console.log('❌ Adjacent sprint creation failed - overlap validation issue');
      
      // Check for error messages
      const errorElements = await page.locator('.error, .text-red-500, .text-red-600').allTextContents();
      if (errorElements.length > 0) {
        console.log('Error messages:', errorElements);
      }
      
      await page.screenshot({ path: 'sprint2-overlap-error.png' });
    }
    
    // Create third sprint that SHOULD overlap (same dates as first)
    console.log('\\n=== Creating Overlapping Sprint (Should Fail) ===');
    if (!modalVisible) {
      await page.click('text=Create Sprint');
      await page.waitForTimeout(500);
    }
    
    await page.fill('input[x-model="sprintForm.name"]', 'Sprint 3 - Overlapping');
    await page.fill('input[x-model="sprintForm.startDate"]', '2025-08-05'); // Overlaps with first sprint
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    modalVisible = await page.isVisible('[x-show="showCreateSprintModal"]');
    if (modalVisible) {
      console.log('✅ Overlapping sprint correctly rejected');
      
      // Check for overlap error message
      const errorElements = await page.locator('.error, .text-red-500, .text-red-600').allTextContents();
      const hasOverlapError = errorElements.some(error => error.toLowerCase().includes('overlap'));
      
      if (hasOverlapError) {
        console.log('✅ Overlap error message displayed correctly');
      } else {
        console.log('❌ Overlap error message not found');
        console.log('Error messages found:', errorElements);
      }
    } else {
      console.log('❌ Overlapping sprint was incorrectly allowed');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'sprint-overlap-test.png', fullPage: true });
    console.log('\\nFinal screenshot saved: sprint-overlap-test.png');
    
    // Check sprint count
    const sprintCards = await page.locator('.sprint-card, [data-sprint]').count();
    console.log(`\\nTotal sprints created: ${sprintCards}`);
    
    if (jsErrors.length > 0) {
      console.log('\\n❌ JavaScript errors:');
      jsErrors.forEach(error => console.log(`  ${error}`));
    } else {
      console.log('\\n✅ No JavaScript errors detected');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'overlap-test-error.png' });
  } finally {
    await browser.close();
  }
}

testSprintOverlap();