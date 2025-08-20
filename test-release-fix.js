const { chromium } = require('playwright');

async function testReleaseFix() {
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
    
    page.on('pageerror', error => {
      jsErrors.push(`Page Error: ${error.message}`);
    });
    
    await page.goto('http://localhost:60730');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    // First create a work stream to associate with the release
    console.log('\\n=== Creating Work Stream ===');
    await page.click('text=Work Streams');
    await page.waitForTimeout(1000);
    
    try {
      await page.click('text=Create Your First Work Stream');
      await page.waitForTimeout(500);
      
      await page.fill('input[x-model="workStreamForm.name"]', 'Frontend Development');
      await page.selectOption('select[x-model="workStreamForm.color"]', 'blue');
      
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      console.log('✅ Work stream created');
    } catch (error) {
      console.log('ℹ️ Work stream creation step skipped:', error.message);
    }
    
    // Now test release creation
    console.log('\\n=== Testing Release Creation ===');
    await page.click('text=Release Management');
    await page.waitForTimeout(1000);
    
    await page.click('text=Create Your First Release');
    await page.waitForTimeout(500);
    
    await page.fill('input[x-model="releaseForm.name"]', 'Release v1.0');
    await page.fill('input[x-model="releaseForm.targetDate"]', '2025-09-01');
    
    // Try to associate with work stream if available
    const workStreamCheckbox = page.locator('input[type="checkbox"]').first();
    if (await workStreamCheckbox.isVisible({ timeout: 2000 })) {
      await workStreamCheckbox.check();
      console.log('✅ Work stream associated with release');
    }
    
    console.log('✅ Release form filled, submitting...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Check if modal closed (indicating success)
    const modalVisible = await page.isVisible('[x-show="showCreateReleaseModal"]');
    if (!modalVisible) {
      console.log('🎉 Release created successfully!');
      
      // Check for release cards
      const releaseCards = await page.locator('.release-card, [data-release]').count();
      console.log(`Found ${releaseCards} release cards`);
    } else {
      console.log('❌ Release creation failed - modal still open');
    }
    
    // Check for specific workStreamManager errors
    const workStreamErrors = jsErrors.filter(error => 
      error.includes('workStreamManager') || 
      error.includes('getWorkStream') ||
      error.includes('updateWorkStreamAssociations')
    );
    
    console.log('\\n=== Error Analysis ===');
    console.log(`Total JavaScript errors: ${jsErrors.length}`);
    console.log(`WorkStream-related errors: ${workStreamErrors.length}`);
    
    if (workStreamErrors.length > 0) {
      console.log('\\nWorkStream-related errors:');
      workStreamErrors.forEach(error => console.log(`❌ ${error}`));
    } else {
      console.log('✅ No WorkStream-related errors detected!');
    }
    
    if (jsErrors.length === 0) {
      console.log('🎉 All JavaScript errors resolved!');
    }
    
    // Look for success messages
    const successMessages = consoleMessages.filter(msg => 
      msg.includes('successfully') || msg.includes('Loaded') && msg.includes('releases')
    );
    
    if (successMessages.length > 0) {
      console.log('\\nSuccess messages:');
      successMessages.forEach(msg => console.log(`✅ ${msg}`));
    }
    
    await page.screenshot({ path: 'release-fix-test.png', fullPage: true });
    console.log('\\nScreenshot saved: release-fix-test.png');
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'release-test-error.png' });
  } finally {
    await browser.close();
  }
}

testReleaseFix();