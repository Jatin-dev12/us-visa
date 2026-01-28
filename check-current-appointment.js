import { VisaHttpClient } from './src/lib/client.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

dotenv.config();

async function checkCurrentAppointment() {
    try {
        console.log('🔍 Checking Your Current Appointment\n');
        
        const email = process.env.EMAIL;
        const password = process.env.PASSWORD;
        const countryCode = process.env.COUNTRY_CODE;
        const scheduleId = process.env.SCHEDULE_ID;

        const client = new VisaHttpClient(countryCode, email, password);
        
        console.log('Logging in...');
        const sessionHeaders = await client.login();
        console.log('✅ Login successful!\n');
        
        // Get the appointment page
        const url = `https://ais.usvisa-info.com/en-${countryCode}/niv/schedule/${scheduleId}/continue_actions`;
        console.log('Fetching appointment page...');
        console.log('URL:', url, '\n');
        
        const response = await fetch(url, { headers: sessionHeaders });
        const html = await response.text();
        const $ = cheerio.load(html);
        
        // Look for appointment details
        console.log('📅 Current Appointment Details:\n');
        console.log('='.repeat(60));
        
        // Find appointment date
        const appointmentText = $('body').text();
        
        // Look for date patterns
        const datePattern = /(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\w+ \d{1,2}, \d{4})/g;
        const dates = appointmentText.match(datePattern);
        
        if (dates && dates.length > 0) {
            console.log('Found dates in page:');
            dates.slice(0, 5).forEach(date => console.log('  -', date));
        }
        
        // Look for specific appointment info
        const appointmentInfo = $('.consular-appt, .appointment-info, .appointment-details');
        if (appointmentInfo.length > 0) {
            console.log('\nAppointment Info:');
            console.log(appointmentInfo.text().trim());
        }
        
        // Check for confirmation message
        const confirmationMsg = $('.alert-info, .alert-success, .confirmation');
        if (confirmationMsg.length > 0) {
            console.log('\nConfirmation Message:');
            console.log(confirmationMsg.text().trim());
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('\n💡 To see full details, log in to:');
        console.log(`   https://ais.usvisa-info.com/en-${countryCode}/niv/schedule/${scheduleId}/continue_actions`);
        
    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

checkCurrentAppointment();
