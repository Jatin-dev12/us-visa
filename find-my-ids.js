#!/usr/bin/env node

import { VisaHttpClient } from './src/lib/client.js';
import { getConfig } from './src/lib/config.js';
import cheerio from 'cheerio';
import fetch from 'node-fetch';

async function findMyIds() {
  try {
    console.log('='.repeat(60));
    console.log('  FINDING YOUR CORRECT SCHEDULE ID & FACILITY IDs');
    console.log('='.repeat(60));
    
    const config = getConfig();
    
    console.log('\n📧 Email:', config.email);
    console.log('🌍 Country:', config.countryCode.toUpperCase());
    console.log('\n🔐 Logging in...');
    
    const client = new VisaHttpClient(config.countryCode, config.email, config.password);
    const sessionHeaders = await client.login();
    
    console.log('✅ Login successful!\n');
    
    // Fetch the groups/appointment page
    const appointmentUrl = `https://ais.usvisa-info.com/en-${config.countryCode}/niv/groups`;
    const response = await fetch(appointmentUrl, {
      headers: sessionHeaders
    });
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Find all schedule IDs from links
    const scheduleIds = new Set();
    $('a[href*="/schedule/"]').each((i, elem) => {
      const href = $(elem).attr('href');
      const match = href?.match(/\/schedule\/(\d+)/);
      if (match) {
        scheduleIds.add(match[1]);
      }
    });
    
    // If no schedule IDs found, try the current one from .env
    if (scheduleIds.size === 0 && config.scheduleId) {
      console.log('⚠️  No schedule IDs found in page, testing .env Schedule ID...');
      scheduleIds.add(config.scheduleId);
    }
    
    if (scheduleIds.size === 0) {
      console.log('❌ No schedule IDs found. Please check your account.');
      return;
    }
    
    console.log('📋 Found Schedule IDs:', Array.from(scheduleIds).join(', '));
    console.log('\n' + '='.repeat(60));
    console.log('  TESTING EACH SCHEDULE ID WITH FACILITY IDs');
    console.log('='.repeat(60));
    
    const facilityIds = ['89', '90', '91', '92', '93', '94', '95'];
    let foundAny = false;
    
    for (const scheduleId of scheduleIds) {
      console.log(`\n📌 Schedule ID: ${scheduleId}`);
      console.log('-'.repeat(60));
      
      for (const facilityId of facilityIds) {
        const url = `https://ais.usvisa-info.com/en-${config.countryCode}/niv/schedule/${scheduleId}/appointment/days/${facilityId}.json?appointments[expedite]=false`;
        
        try {
          const response = await fetch(url, {
            headers: {
              ...sessionHeaders,
              "Accept": "application/json",
              "X-Requested-With": "XMLHttpRequest"
            }
          });
          
          if (response.status === 200) {
            const dates = await response.json();
            if (dates && dates.length > 0) {
              foundAny = true;
              console.log(`\n  ✅ Facility ID: ${facilityId}`);
              console.log(`     Total dates available: ${dates.length}`);
              console.log(`     First date: ${dates[0].date}`);
              console.log(`     Last date: ${dates[dates.length - 1].date}`);
              
              // Check for 2026 dates
              const dates2026 = dates.filter(d => d.date.startsWith('2026'));
              if (dates2026.length > 0) {
                console.log(`     ⭐ 2026 dates: ${dates2026.length} found!`);
              } else {
                console.log(`     ⚠️  No 2026 dates (earliest: ${dates[0].date})`);
              }
            }
          }
        } catch (e) {
          // Skip errors silently
        }
      }
    }
    
    if (!foundAny) {
      console.log('\n❌ No valid facility IDs found for any schedule.');
      return;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('  RECOMMENDED .ENV CONFIGURATION');
    console.log('='.repeat(60));
    
    // Find the best combination (one with most dates)
    let bestSchedule = null;
    let bestFacility = null;
    let maxDates = 0;
    
    for (const scheduleId of scheduleIds) {
      for (const facilityId of facilityIds) {
        const url = `https://ais.usvisa-info.com/en-${config.countryCode}/niv/schedule/${scheduleId}/appointment/days/${facilityId}.json?appointments[expedite]=false`;
        
        try {
          const response = await fetch(url, {
            headers: {
              ...sessionHeaders,
              "Accept": "application/json",
              "X-Requested-With": "XMLHttpRequest"
            }
          });
          
          if (response.status === 200) {
            const dates = await response.json();
            if (dates && dates.length > maxDates) {
              maxDates = dates.length;
              bestSchedule = scheduleId;
              bestFacility = facilityId;
            }
          }
        } catch (e) {
          // Skip
        }
      }
    }
    
    if (bestSchedule && bestFacility) {
      console.log('\n📝 Update your .env file with these values:\n');
      console.log(`EMAIL=${config.email}`);
      console.log(`PASSWORD=${config.password}`);
      console.log(`COUNTRY_CODE=${config.countryCode}`);
      console.log(`SCHEDULE_ID=${bestSchedule}`);
      console.log(`FACILITY_ID=${bestFacility}`);
      console.log(`REFRESH_DELAY=3`);
      console.log(`\n✨ This combination has the most available dates (${maxDates} dates)`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Done!');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nPlease check your credentials in .env file.');
  }
}

findMyIds();
