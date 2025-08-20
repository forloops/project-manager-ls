const { chromium } = require('playwright');

async function testCapacityAllocation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:55100');
    await page.waitForLoadState('networkidle');
    
    console.log('Page loaded:', await page.title());
    
    // Wait for the page to be fully loaded
    await page.waitForTimeout(2000);
    
    // Look for Capacity Planning section
    console.log('Looking for Capacity Planning navigation...');
    
    // Try to find and click on Capacity Planning
    const capacityPlanningButton = page.locator('text=Capacity Planning').first();
    if (await capacityPlanningButton.isVisible()) {
      console.log('Found Capacity Planning button, clicking...');
      await capacityPlanningButton.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('Capacity Planning button not found, checking navigation menu...');
      // Look for navigation items
      const navItems = await page.locator('nav a, .nav-item, [role="navigation"] a').allTextContents();
      console.log('Available navigation items:', navItems);
    }
    
    // Look for Sprint Plan Capacity links
    console.log('Looking for Sprint Plan Capacity links...');
    
    // Wait for any dynamic content to load
    await page.waitForTimeout(2000);
    
    // Try to find sprint cards with capacity planning links
    const sprintCards = page.locator('.sprint-card, .card, [data-sprint]');
    const cardCount = await sprintCards.count();
    console.log(`Found ${cardCount} potential sprint cards`);
    
    if (cardCount > 0) {
      for (let i = 0; i < Math.min(cardCount, 3); i++) {
        const card = sprintCards.nth(i);
        const cardText = await card.textContent();
        console.log(`Card ${i + 1} content:`, cardText?.substring(0, 100) + '...');
        
        // Look for capacity planning links within the card
        const capacityLink = card.locator('text=Plan Capacity, text=Capacity, a[href*="capacity"]').first();
        if (await capacityLink.isVisible()) {
          console.log(`Found capacity link in card ${i + 1}, clicking...`);
          await capacityLink.click();
          await page.waitForTimeout(2000);
          break;
        }
      }
    } else {
      // Try alternative approaches to find capacity planning
      const allLinks = await page.locator('a').allTextContents();
      console.log('All links on page:', allLinks.filter(link => link.toLowerCase().includes('capacity')));
      
      // Try clicking any capacity-related link
      const capacityLink = page.locator('a').filter({ hasText: /capacity/i }).first();
      if (await capacityLink.isVisible()) {
        console.log('Found general capacity link, clicking...');
        await capacityLink.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Now look for Daily Capacity Allocation screen
    console.log('Looking for Daily Capacity Allocation screen...');
    
    // Check current page content for capacity allocation UI
    const pageContent = await page.textContent('body');
    
    if (pageContent.includes('Daily Capacity') || pageContent.includes('Allocation')) {
      console.log('Found Daily Capacity Allocation screen!');
      
      // Look for UI elements related to adding activities
      console.log('Analyzing UI for adding multiple activities...');
      
      // Look for add buttons, forms, or input fields
      const addButtons = await page.locator('button').filter({ hasText: /add|new|\+/i }).allTextContents();
      console.log('Add buttons found:', addButtons);
      
      const forms = await page.locator('form').count();
      console.log('Forms found:', forms);
      
      const inputs = await page.locator('input, select, textarea').count();
      console.log('Input fields found:', inputs);
      
      // Take a screenshot of the current state
      await page.screenshot({ path: 'capacity-allocation-screen.png', fullPage: true });
      console.log('Screenshot saved as capacity-allocation-screen.png');
      
      // Look specifically for activity-related elements
      const activityElements = await page.locator('*').filter({ hasText: /activity|activities/i }).allTextContents();
      console.log('Activity-related elements:', activityElements);
      
    } else {
      console.log('Daily Capacity Allocation screen not found');
      console.log('Current page appears to contain:', pageContent.substring(0, 200) + '...');
      
      // Take a screenshot to see current state
      await page.screenshot({ path: 'current-page-state.png', fullPage: true });
      console.log('Screenshot saved as current-page-state.png');
    }
    
  } catch (error) {
    console.error('Error during testing:', error);
    await page.screenshot({ path: 'error-state.png' });
  } finally {
    await browser.close();
  }
}

testCapacityAllocation();