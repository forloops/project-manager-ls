const { chromium } = require('playwright');

async function testSprintDebug() {
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
    
    // Debug: Check what form fields are available
    const nameInput = page.locator('input[x-model="sprintForm.name"]');
    const dateInput = page.locator('input[x-model="sprintForm.startDate"]');
    const durationSelect = page.locator('select[x-model="sprintForm.duration"]');
    
    console.log('Name input visible:', await nameInput.isVisible());
    console.log('Date input visible:', await dateInput.isVisible());
    console.log('Duration select visible:', await durationSelect.isVisible());
    
    // Try a more specific approach to filling the name
    await nameInput.click();
    await nameInput.fill('Debug Test Sprint');
    await page.waitForTimeout(500);
    
    const nameValue = await nameInput.inputValue();
    console.log('Name input value after fill:', nameValue);
    
    // Check the sprintForm data in Alpine
    const formData = await page.evaluate(() => {
      const appElement = document.querySelector('[x-data*="sprintApp"]');
      if (appElement && Alpine) {
        const appData = Alpine.$data(appElement);
        return appData.sprintForm;
      }
      return null;
    });
    
    console.log('Alpine sprintForm data:', JSON.stringify(formData, null, 2));
    
    // Try to submit and see what happens
    console.log('Attempting form submission...');
    await page.click('button:has-text("Create Sprint")');
    await page.waitForTimeout(1000);
    
    // Check for validation errors or success
    const formDataAfterSubmit = await page.evaluate(() => {
      const appElement = document.querySelector('[x-data*="sprintApp"]');
      if (appElement && Alpine) {
        const appData = Alpine.$data(appElement);
        return {
          sprintForm: appData.sprintForm,
          showCreateSprintModal: appData.showCreateSprintModal,
          sprints: appData.sprints
        };
      }
      return null;
    });
    
    console.log('After submit - Alpine data:');
    console.log('  Modal still open:', formDataAfterSubmit?.showCreateSprintModal);
    console.log('  Sprints count:', formDataAfterSubmit?.sprints?.length);
    console.log('  Form data:', JSON.stringify(formDataAfterSubmit?.sprintForm, null, 2));
    
    await page.screenshot({ path: 'sprint-debug-result.png', fullPage: true });
    console.log('Debug screenshot saved');
    
  } catch (error) {
    console.error('Debug test error:', error);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    await browser.close();
  }
}

testSprintDebug();