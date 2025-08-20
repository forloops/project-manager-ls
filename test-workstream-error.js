const { chromium } = require('playwright');

async function testWorkStreamError() {
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
    
    // Wait for any initial errors to appear
    await page.waitForTimeout(3000);
    
    // Check if workStreamManager methods are available
    const workStreamManagerInfo = await page.evaluate(() => {
      if (!window.workStreamManager) {
        return { available: false };
      }
      
      return {
        available: true,
        hasGetWorkStream: typeof window.workStreamManager.getWorkStream === 'function',
        hasGetWorkStreamById: typeof window.workStreamManager.getWorkStreamById === 'function',
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(window.workStreamManager))
      };
    });
    
    console.log('WorkStreamManager info:', JSON.stringify(workStreamManagerInfo, null, 2));
    
    // Check for the specific error we were trying to fix
    const workStreamErrors = jsErrors.filter(error => 
      error.includes('getWorkStream is not a function') ||
      error.includes('updateWorkStreamAssociations') ||
      error.includes('workStreamManager')
    );
    
    console.log('\\n=== Error Analysis ===');
    console.log(`Total JavaScript errors: ${jsErrors.length}`);
    console.log(`WorkStream method errors: ${workStreamErrors.length}`);
    
    if (workStreamErrors.length > 0) {
      console.log('\\nWorkStream method errors still present:');
      workStreamErrors.forEach(error => console.log(`❌ ${error}`));
    } else {
      console.log('✅ No WorkStream method errors detected!');
    }
    
    // Check if the specific error message is gone
    const getWorkStreamErrors = jsErrors.filter(error => 
      error.includes('getWorkStream is not a function')
    );
    
    if (getWorkStreamErrors.length === 0) {
      console.log('🎉 The getWorkStream method error has been resolved!');
    } else {
      console.log('❌ getWorkStream method error still exists');
    }
    
    if (jsErrors.length === 0) {
      console.log('🎉 No JavaScript errors at all!');
    } else {
      console.log('\\nAll JavaScript errors:');
      jsErrors.forEach(error => console.log(`🐛 ${error}`));
    }
    
    await page.screenshot({ path: 'workstream-error-test.png', fullPage: true });
    console.log('\\nScreenshot saved: workstream-error-test.png');
    
  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'workstream-test-error.png' });
  } finally {
    await browser.close();
  }
}

testWorkStreamError();