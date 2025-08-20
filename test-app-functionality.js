const { chromium } = require('playwright');

async function testAppFunctionality() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:58928');
    await page.waitForLoadState('networkidle');
    
    console.log('Page loaded:', await page.title());
    await page.waitForTimeout(2000);
    
    // Check for JavaScript errors
    let jsErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    // Check for specific error handling
    await page.evaluate(() => {
      window.testErrors = [];
      const originalError = console.error;
      console.error = function(...args) {
        window.testErrors.push(args.join(' '));
        originalError.apply(console, args);
      };
    });
    
    // Test navigation to Capacity Planning
    console.log('Testing Capacity Planning navigation...');
    const capacityPlanningTab = page.locator('text=Capacity Planning').first();
    if (await capacityPlanningTab.isVisible()) {
      await capacityPlanningTab.click();
      await page.waitForTimeout(2000);
      console.log('✅ Successfully navigated to Capacity Planning');
    }
    
    // Test creating a sprint first
    console.log('Testing sprint creation...');
    const createSprintButton = page.locator('text=Create Sprint, text=Create Your First Sprint').first();
    if (await createSprintButton.isVisible()) {
      await createSprintButton.click();
      await page.waitForTimeout(1000);
      
      // Fill in sprint details
      await page.fill('input[placeholder*="Sprint"], input[name*="name"], input[placeholder*="name"]', 'Test Sprint for Multi-Activity');
      
      // Set dates
      const dateInputs = page.locator('input[type="date"]');
      const dateCount = await dateInputs.count();
      if (dateCount > 0) {
        await dateInputs.first().fill('2025-08-20');
        if (dateCount > 1) {
          await dateInputs.nth(1).fill('2025-09-02');
        }
      }
      
      // Save the sprint
      const saveButton = page.locator('button').filter({ hasText: /save|create|add/i }).first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Sprint created successfully');
      }
    }
    
    // Check for Activity Model availability
    const activityModelAvailable = await page.evaluate(() => {
      return typeof window.ActivityModel !== 'undefined';
    });
    console.log('Activity Model available:', activityModelAvailable);
    
    // Check for Activity Modal availability
    const activityModalAvailable = await page.evaluate(() => {
      return typeof window.activityModal !== 'undefined';
    });
    console.log('Activity Modal available:', activityModalAvailable);
    
    // Check for Capacity Tracker availability
    const capacityTrackerAvailable = await page.evaluate(() => {
      return typeof window.capacityTracker !== 'undefined';
    });
    console.log('Capacity Tracker available:', capacityTrackerAvailable);
    
    // Check for switchViewMode function
    const switchViewModeAvailable = await page.evaluate(() => {
      return typeof window.capacityPlannerComponent !== 'undefined';
    });
    console.log('Capacity Planner Component available:', switchViewModeAvailable);
    
    // Take screenshot of current state
    await page.screenshot({ path: 'app-functionality-test.png', fullPage: true });
    console.log('Screenshot saved: app-functionality-test.png');
    
    // Check for any JavaScript errors collected
    const collectedErrors = await page.evaluate(() => window.testErrors || []);
    
    console.log('\\n=== JavaScript Error Summary ===');
    console.log('Page console errors:', jsErrors.length);
    console.log('Collected errors:', collectedErrors.length);
    
    if (jsErrors.length > 0) {
      console.log('Console errors:', jsErrors);
    }
    
    if (collectedErrors.length > 0) {
      console.log('Collected errors:', collectedErrors);
    }
    
    if (jsErrors.length === 0 && collectedErrors.length === 0) {
      console.log('✅ No JavaScript errors detected!');
    }
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'test-error-state.png' });
  } finally {
    await browser.close();
  }
}

testAppFunctionality();