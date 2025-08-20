const { chromium } = require('playwright');

async function testCapacityErrors() {
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
    
    await page.goto('http://localhost:60345'); // Updated port
    await page.waitForLoadState('networkidle');
    console.log('Page loaded successfully');
    
    // Navigate to Capacity Planning and trigger the planner
    await page.click('text=Capacity Planning');
    await page.waitForTimeout(1000);
    
    // Try to trigger capacity planner by creating a sprint and accessing it
    try {
      await page.click('text=Create Sprint', { timeout: 5000 });
      await page.waitForTimeout(500);
      
      await page.fill('input[placeholder*="Sprint"], input[name*="name"]', 'Test Sprint');
      await page.fill('input[type="date"]', '2025-08-20');
      
      await page.click('button:has-text("Save"), button:has-text("Create")');
      await page.waitForTimeout(2000);
      
      // Look for and click Plan Capacity
      const planCapacityButton = page.locator('text=Plan Capacity').first();
      if (await planCapacityButton.isVisible({ timeout: 5000 })) {
        await planCapacityButton.click();
        await page.waitForTimeout(3000);
        console.log('✅ Successfully triggered capacity planner');
      } else {
        console.log('ℹ️  Plan Capacity button not found, checking for other capacity interfaces');
        
        // Check for Interactive Capacity Planner
        const interactivePlanner = page.locator('text=Interactive Capacity Planner');
        if (await interactivePlanner.isVisible({ timeout: 2000 })) {
          console.log('✅ Interactive Capacity Planner is visible');
        }
      }
    } catch (error) {
      console.log('Sprint creation step failed:', error.message);
    }
    
    await page.waitForTimeout(2000);
    
    // Check for specific Alpine.js errors
    const alpineErrors = jsErrors.filter(error => 
      error.includes('showOptimizations') || 
      error.includes('switchViewMode') ||
      error.includes('Alpine') ||
      error.includes('undefined')
    );
    
    console.log('\\n=== Error Analysis ===');
    console.log(`Total JavaScript errors: ${jsErrors.length}`);
    console.log(`Alpine.js related errors: ${alpineErrors.length}`);
    
    if (alpineErrors.length > 0) {
      console.log('\\nAlpine.js errors:');
      alpineErrors.forEach(error => console.log(`❌ ${error}`));
    }
    
    if (jsErrors.length > 0) {
      console.log('\\nAll errors:');
      jsErrors.forEach(error => console.log(`🐛 ${error}`));
    }
    
    if (jsErrors.length === 0) {
      console.log('✅ No JavaScript errors detected!');
    }
    
    await page.screenshot({ path: 'capacity-error-test.png', fullPage: true });
    console.log('Screenshot saved: capacity-error-test.png');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testCapacityErrors();