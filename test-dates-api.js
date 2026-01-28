import { VisaHttpClient } from './src/lib/client.js';
import dotenv from 'dotenv';

dotenv.config();

async function testDatesAPI() {
    try {
        console.log('Testing dates API...\n');
        
        const email = process.env.EMAIL;
        const password = process.env.PASSWORD;
        const countryCode = process.env.COUNTRY_CODE;
        const scheduleId = process.env.SCHEDULE_ID;
        const facilityId = process.env.FACILITY_ID;

        console.log('Configuration:');
        console.log('- Email:', email);
        console.log('- Country Code:', countryCode);
        console.log('- Schedule ID:', scheduleId);
        console.log('- Facility ID:', facilityId);
        console.log('- Base URL:', `https://ais.usvisa-info.com/en-${countryCode}/niv`);
        console.log('\n');

        console.log('Step 1: Creating client...');
        const client = new VisaHttpClient(countryCode, email, password);
        
        console.log('Step 2: Logging in...');
        const sessionHeaders = await client.login();
        console.log('✅ Login successful!');
        console.log('Session headers:', Object.keys(sessionHeaders));
        console.log('\n');
        
        console.log('Step 3: Fetching available dates...');
        const url = `https://ais.usvisa-info.com/en-${countryCode}/niv/schedule/${scheduleId}/appointment/days/${facilityId}.json?appointments[expedite]=false`;
        console.log('URL:', url);
        console.log('\n');
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(url, {
            headers: {
                ...sessionHeaders,
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest"
            }
        });
        
        console.log('Response status:', response.status, response.statusText);
        console.log('Response content-type:', response.headers.get('content-type'));
        console.log('\n');
        
        if (!response.ok) {
            const text = await response.text();
            console.error('❌ Error response:', text.substring(0, 500));
            return;
        }
        
        const data = await response.json();
        console.log('✅ Response received!');
        console.log('Data type:', Array.isArray(data) ? 'Array' : typeof data);
        console.log('Data length:', Array.isArray(data) ? data.length : 'N/A');
        
        if (Array.isArray(data) && data.length > 0) {
            console.log('\nFirst 5 dates:');
            data.slice(0, 5).forEach(item => {
                console.log('  -', item.date);
            });
            console.log(`\n✅ Total available dates: ${data.length}`);
        } else {
            console.log('\n⚠️ No dates available');
        }
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }
}

testDatesAPI();
