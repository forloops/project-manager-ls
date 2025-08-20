#!/usr/bin/env node

// Quick test to check the boundary calculation
function testBoundary() {
    const startDate = '2024-01-01';
    const endDate = '2024-01-14';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    console.log('Start date:', startDate, '(', start.getDay(), ')');
    console.log('End date:', endDate, '(', end.getDay(), ')');
    
    let dayCount = 0;
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        dayCount++;
        console.log(`Day ${dayCount}: ${date.toISOString().split('T')[0]} (day of week: ${date.getDay()})`);
    }
    
    console.log(`Total days: ${dayCount}`);
}

testBoundary();