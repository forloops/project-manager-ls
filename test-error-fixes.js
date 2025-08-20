const { chromium } = require('playwright');

async function testErrorFixes() {
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
    
    await page.goto('http://localhost:58056'); // Updated with correct port
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');
    
    // Test capacity planning navigation which triggers the errors
    await page.click('text=Capacity Planning');
    await page.waitForTimeout(2000);
    
    console.log('✅ Navigated to Capacity Planning');
    
    // Try to trigger different capacity views that were causing errors
    const capacityDashboardAvailable = await page.evaluate(() => {
      return typeof window.capacityDashboardManager !== 'undefined';
    });
    console.log('Capacity Dashboard Manager available:', capacityDashboardAvailable);
    
    // Test capacity view switching if possible
    try {
      await page.evaluate(() => {
        if (window.Alpine && document.querySelector('[x-data*="sprintApp"]')) {
          const app = Alpine.$data(document.querySelector('[x-data*="sprintApp"]'));
          if (app && typeof app.switchCapacityView === 'function') {
            app.capacityViewMode = 'dashboard';
            app.switchCapacityView();
          }
        }
      });
      
      await page.waitForTimeout(1000);
      console.log('✅ Tested dashboard view switch');
      
    } catch (error) {
      console.log('ℹ️ Dashboard view switch not available:', error.message);
    }
    
    // Test analytics view
    try {
      await page.evaluate(() => {
        if (window.Alpine && document.querySelector('[x-data*="sprintApp"]')) {
          const app = Alpine.$data(document.querySelector('[x-data*="sprintApp"]'));
          if (app && typeof app.switchCapacityView === 'function') {
            app.capacityViewMode = 'analytics';
            app.switchCapacityView();
          }
        }
      });
      
      await page.waitForTimeout(1000);
      console.log('✅ Tested analytics view switch');
      
    } catch (error) {
      console.log('ℹ️ Analytics view switch not available:', error.message);
    }
    
    // Filter JavaScript errors
    const relevantErrors = jsErrors.filter(error => 
      error.includes('capacityDashboard') || 
      error.includes('initializeForecastChart') ||
      error.includes('TypeError') ||
      error.includes('function')
    );
    
    console.log('\\n=== Error Analysis ===');
    console.log(`Total JavaScript errors: ${jsErrors.length}`);
    console.log(`Capacity-related errors: ${relevantErrors.length}`);
    
    if (relevantErrors.length > 0) {
      console.log('\\nCapacity-related errors:');
      relevantErrors.forEach(error => console.log(`❌ ${error}`));
    } else {
      console.log('✅ No capacity-related JavaScript errors detected!');
    }
    
    if (jsErrors.length === 0) {
      console.log('🎉 All JavaScript errors have been resolved!');
    }
    
    // Look for relevant console messages
    const infoMessages = consoleMessages.filter(msg => 
      msg.includes('Forecast chart') || 
      msg.includes('Velocity chart') ||
      msg.includes('Utilization chart') ||
      msg.includes('CapacityDashboard')
    );
    
    if (infoMessages.length > 0) {
      console.log('\\nRelevant console messages:');
      infoMessages.forEach(msg => console.log(`ℹ️ ${msg}`));
    }
    
    await page.screenshot({ path: 'error-fixes-test.png', fullPage: true });
    console.log('Screenshot saved: error-fixes-test.png');
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'error-fixes-error.png' });
  } finally {
    await browser.close();
  }
}

testErrorFixes();