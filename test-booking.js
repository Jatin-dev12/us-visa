import { VisaHttpClient } from './src/lib/client.js';
import dotenv from 'dotenv';

dotenv.config();

async function testBooking() {
    try {
        console.log('🧪 Testing Booking Process\n');
        
        const email = process.env.EMAIL;
        const password = process.env.PASSWORD;
        const countryCode = process.env.COUNTRY_CODE;
        const scheduleId = process.env.SCHEDULE_ID;
        const facilityId = process.env.FACILITY_ID;

        console.log('Configuration:');
        console.log('- Email:', email);
        console.log('- Country:', countryCode);
        console.log('- Schedule ID:', scheduleId);
        console.log('- Facility ID:', facilityId);
        console.log('\n');

        const client = new VisaHttpClient(countryCode, email, password);
        
        console.log('Step 1: Logging in...');
        const sessionHeaders = await client.login();
        console.log('✅ Login successful!\n');
        
        console.log('Step 2: Getting available dates...');
        const dates = await client.checkAvailableDate(sessionHeaders, scheduleId, facilityId);
        console.log(`✅ Found ${dates.length} dates\n`);
        
        if (dates.length === 0) {
            console.log('❌ No dates available to test booking');
            return;
        }
        
        const testDate = dates[0];
        console.log(`Step 3: Getting available times for ${testDate}...`);
        const time = await client.checkAvailableTime(sessionHeaders, scheduleId, facilityId, testDate);
        console.log(`✅ Found time: ${time}\n`);
        
        if (!time) {
            console.log('❌ No time slots available');
            return;
        }
        
        console.log('⚠️  DRY RUN - Not actually booking');
        console.log(`Would book: ${testDate} at ${time}`);
        console.log('\nTo actually book, the bot needs to call:');
        console.log(`client.book(sessionHeaders, "${scheduleId}", "${facilityId}", "${testDate}", "${time}")`);
        console.log('\n✅ All booking prerequisites are met!');
        console.log('The bot should be able to book successfully.');
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error(error.stack);
    }
}

testBooking();
