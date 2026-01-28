import fetch from 'node-fetch';

async function testFrontendAPI() {
    console.log('Testing Frontend API endpoints...\n');
    
    const API_URL = 'http://localhost:3000/api';
    
    // Test data
    const testData = {
        email: 'hiteshheer4@gmail.com',
        password: 'Hiteshkumar@1234',
        countryCode: 'ca',
        scheduleId: '71525742',
        facilityId: '94',
        refreshDelay: 3
    };
    
    try {
        console.log('1. Testing /api/dates endpoint...');
        console.log('   Sending:', JSON.stringify(testData, null, 2));
        
        const response = await fetch(`${API_URL}/dates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        console.log('   Response status:', response.status);
        console.log('   Response content-type:', response.headers.get('content-type'));
        
        const data = await response.json();
        
        console.log('\n2. Response data:');
        console.log('   - Has error?', !!data.error);
        if (data.error) {
            console.log('   - Error message:', data.error);
        }
        console.log('   - Has dates?', !!data.dates);
        console.log('   - Dates count:', data.dates ? data.dates.length : 0);
        
        if (data.dates && data.dates.length > 0) {
            console.log('\n✅ SUCCESS! Dates found:');
            console.log('   First 5 dates:', data.dates.slice(0, 5));
            console.log('   Total:', data.dates.length, 'dates');
            
            // Group by year
            const byYear = {};
            data.dates.forEach(date => {
                const year = date.substring(0, 4);
                byYear[year] = (byYear[year] || 0) + 1;
            });
            console.log('\n   By year:', byYear);
        } else {
            console.log('\n⚠️  No dates in response');
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('   Make sure server is running: node server.js');
    }
}

testFrontendAPI();
