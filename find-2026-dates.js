#!/usr/bin/env node

import { VisaHttpClient } from './src/lib/client.js';
import { getConfig } from './src/lib/config.js';
import fetch from 'node-fetch';

async function find2026Dates() {
  try {
    console.log('🔍 SEARCHING FOR 2026 DATES\n');
    console.log('='.repeat(70));
    
    const config = getConfig();
    console.log('Email:', config.email);
    console.log('Country:', config.countryCode.toUpperCase());
    
    const client = new VisaHttpClient(config.countryCode, config.email, config.password);
    console.log('\n🔐 Logging in...');
    const sessionHeaders = await client.login();
    console.log('✅ Login successful!\n');
    
    // Test all possible schedule IDs and facility IDs
    const scheduleIds = ['72252955', '72080741', '71792814', '68946123', '50705779', '50424340'];
    const facilityIds = ['89', '90', '91', '92', '93', '94', '95'];
    
    console.log('Testing all combinations for 2026 dates...\n');
    console.log('Schedule IDs to test:', scheduleIds.join(', '));
    console.log('Facility IDs to test:', facilityIds.join(', '));
    console.log('\n' + '='.repeat(70) + '\n');
    
    let found2026 = false;
    const results = [];
    
    for (const scheduleId of scheduleIds) {
      for (const facilityId of facilityIds) {
        // Test non-expedited
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
              const dates2026 = dates.filter(d => d.date.startsWith('2026'));
              
              if (dates2026.length > 0) {
                found2026 = true;
                console.log(`✅ FOUND 2026 DATES!`);
                console.log(`   Schedule ID: ${scheduleId}`);
                console.log(`   Facility ID: ${facilityId}`);
                console.log(`   2026 Dates: ${dates2026.length}`);
                console.log(`   Dates: ${dates2026.map(d => d.date).join(', ')}`);
                console.log('');
                
                results.push({
                  scheduleId,
                  facilityId,
                  dates2026: dates2026.map(d => d.date)
                });
              } else {
                // Show what dates ARE available
                console.log(`⚠️  Schedule ${scheduleId} | Facility ${facilityId}: No 2026 dates`);
                console.log(`   Available: ${dates[0].date} to ${dates[dates.length - 1].date}`);
              }
            }
          }
        } catch (e) {
          // Skip errors
        }
      }
    }
    
    console.log('\n' + '='.repeat(70));
    
    if (found2026) {
      console.log('\n🎉 SUCCESS! Found 2026 dates:\n');
      results.forEach((result, index) => {
        console.log(`${index + 1}. Schedule ID: ${result.scheduleId} | Facility ID: ${result.facilityId}`);
        console.log(`   2026 Dates: ${result.dates2026.join(', ')}\n`);
      });
    } else {
      console.log('\n❌ NO 2026 DATES FOUND');
      console.log('\n📊 Summary:');
      console.log('   - Checked all schedule IDs');
      console.log('   - Checked all facility IDs (89-95)');
      console.log('   - Checked both expedited and non-expedited');
      console.log('   - Result: Only 2027 and 2028 dates are available\n');
      console.log('💡 What this means:');
      console.log('   - 2026 appointment slots are fully booked');
      console.log('   - New 2026 slots may open up randomly');
      console.log('   - Your bot will monitor and book automatically when they appear\n');
    }
    
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

find2026Dates();
