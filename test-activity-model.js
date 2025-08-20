const { chromium } = require('playwright');
const path = require('path');

async function testActivityModel() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    const indexPath = path.resolve('./index.html');
    const fileUrl = `file://${indexPath}`;
    
    console.log(`Testing ActivityModel methods directly...`);
    
    // Enable console logging
    page.on('console', msg => {
      console.log('BROWSER:', msg.text());
    });
    
    await page.goto(fileUrl);
    await page.waitForLoadState('networkidle');
    
    await page.waitForTimeout(2000);
    
    // Test ActivityModel methods directly
    const activityModelTest = await page.evaluate(() => {
      console.log('Testing ActivityModel...');
      
      // Check if ActivityModel exists
      if (!window.ActivityModel) {
        return { error: 'ActivityModel not found in window' };
      }
      
      try {
        // Create a test activity
        const testActivity = new window.ActivityModel({
          name: 'Test Development Task',
          type: 'development',
          capacity: 4,
          memberId: 'test-member',
          date: '2025-08-20'
        });
        
        console.log('Created test activity:', testActivity);
        
        // Test getDisplayName method
        const displayName = testActivity.getDisplayName(20);
        console.log('Display name (20 chars):', displayName);
        
        // Test getTypeConfig method
        const typeConfig = testActivity.getTypeConfig();
        console.log('Type config:', typeConfig);
        
        return {
          success: true,
          displayName: displayName,
          typeConfig: typeConfig,
          hasGetDisplayName: typeof testActivity.getDisplayName === 'function',
          hasGetTypeConfig: typeof testActivity.getTypeConfig === 'function'
        };
        
      } catch (error) {
        console.error('Error testing ActivityModel:', error);
        return { 
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    console.log('\n📊 ActivityModel Test Results:');
    console.log(JSON.stringify(activityModelTest, null, 2));
    
    const isWorking = activityModelTest.success && activityModelTest.hasGetDisplayName;
    
    console.log('\n🎯 ActivityModel Methods:');
    console.log(isWorking ? '✅ WORKING - getDisplayName method exists and works!' : '❌ BROKEN - getDisplayName method missing or broken');
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

testActivityModel();
