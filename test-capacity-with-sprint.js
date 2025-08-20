const { chromium } = require('playwright');

async function testCapacityWithSprint() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:55100');
    await page.waitForLoadState('networkidle');
    
    console.log('Page loaded:', await page.title());
    await page.waitForTimeout(2000);
    
    // Step 1: Create a sprint first
    console.log('Step 1: Creating a sprint...');
    const createSprintButton = page.locator('text=Create Sprint, text=Create Your First Sprint').first();
    
    if (await createSprintButton.isVisible()) {
      await createSprintButton.click();
      await page.waitForTimeout(1000);
      
      // Fill in sprint details
      await page.fill('input[placeholder*="Sprint"], input[name*="name"], #sprintName', 'Test Sprint 1');
      await page.fill('input[type="date"]', '2025-08-20');
      
      // Look for save/create button
      const saveButton = page.locator('button').filter({ hasText: /save|create|add/i }).first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(2000);
        console.log('Sprint created successfully');
      }
    }
    
    // Step 2: Navigate to Capacity Planning
    console.log('Step 2: Navigating to Capacity Planning...');
    const capacityPlanningTab = page.locator('text=Capacity Planning').first();
    await capacityPlanningTab.click();
    await page.waitForTimeout(2000);
    
    // Step 3: Look for sprint cards and capacity planning links
    console.log('Step 3: Looking for sprint capacity planning...');
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Look for sprint cards or capacity planning interfaces
    const sprintElements = page.locator('[data-sprint], .sprint-card, .card').first();
    
    if (await sprintElements.isVisible()) {
      console.log('Found sprint elements, looking for capacity planning link...');
      
      // Look for capacity planning related links/buttons
      const capacityLinks = page.locator('text=Plan Capacity, text=Daily Capacity, text=Allocation, a[href*="capacity"]');
      const linkCount = await capacityLinks.count();
      
      console.log(`Found ${linkCount} capacity-related links`);
      
      if (linkCount > 0) {
        await capacityLinks.first().click();
        await page.waitForTimeout(2000);
      } else {
        // Try clicking on the sprint card itself
        await sprintElements.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Step 4: Analyze the current capacity allocation interface
    console.log('Step 4: Analyzing capacity allocation interface...');
    
    await page.waitForTimeout(2000);
    
    // Take a screenshot of current state
    await page.screenshot({ path: 'capacity-interface-current.png', fullPage: true });
    
    // Look for activity-related UI elements
    const pageContent = await page.textContent('body');
    
    // Check for existing activity management UI
    const activityInputs = await page.locator('input[placeholder*="activity"], input[name*="activity"], textarea[placeholder*="activity"]').count();
    const activityButtons = await page.locator('button').filter({ hasText: /activity|add.*activity/i }).count();
    const activitySections = await page.locator('*').filter({ hasText: /activity|activities/i }).count();
    
    console.log('Activity Analysis:');
    console.log('- Activity inputs found:', activityInputs);
    console.log('- Activity buttons found:', activityButtons);
    console.log('- Activity-related sections:', activitySections);
    
    // Look for any existing capacity allocation forms or interfaces
    const allForms = await page.locator('form').count();
    const allInputs = await page.locator('input, select, textarea').count();
    const allButtons = await page.locator('button').allTextContents();
    
    console.log('Overall UI Analysis:');
    console.log('- Total forms:', allForms);
    console.log('- Total inputs:', allInputs);
    console.log('- Button texts:', allButtons);
    
    // Check if we can find any capacity allocation tables or grids
    const tables = await page.locator('table, .table, [role="grid"], .grid').count();
    console.log('- Tables/grids found:', tables);
    
    // Look for daily/weekly views
    const timeViews = await page.locator('*').filter({ hasText: /daily|weekly|day|week/i }).allTextContents();
    console.log('- Time-related views:', timeViews.slice(0, 5)); // First 5 items
    
    // Check for any missing multi-activity functionality
    const multiActivityElements = await page.locator('*').filter({ hasText: /multiple.*activity|add.*another|additional.*activity/i }).count();
    console.log('- Multi-activity elements found:', multiActivityElements);
    
    if (multiActivityElements === 0) {
      console.log('❌ ISSUE CONFIRMED: No UI elements found for adding multiple activities');
    } else {
      console.log('✅ Multi-activity UI elements found');
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({ path: 'error-state.png' });
  } finally {
    await browser.close();
  }
}

testCapacityWithSprint();