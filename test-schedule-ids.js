#!/usr/bin/env node

import { VisaHttpClient } from './src/lib/client.js';
import { getConfig } from './src/lib/config.js';
import fetch from 'node-fetch';

async function testScheduleIds() {
  const config = getConfig();
  const client = new VisaHttpClient(config.countryCode, config.email, config.password);
  
  console.log('Logging in...');
  const sessionHeaders = await client.login();
  console.log('✓ Login successful!\n');
  
  const scheduleIds = ['72080741', '71792814'];
  const facilityIds = ['89', '90', '91', '92', '93', '94', '95'];
  
  for (const scheduleId of scheduleIds) {
    console.log(`\n=== Testing Schedule ID: ${scheduleId} ===`);
    
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
            console.log(`✓ FOUND! Schedule ID: ${scheduleId}, Facility ID: ${facilityId}`);
            console.log(`  Total dates: ${dates.length}`);
            console.log(`  First date: ${dates[0].date}`);
            console.log(`  Last date: ${dates[dates.length - 1].date}`);
            
            // Check for 2026 dates
            const dates2026 = dates.filter(d => d.date.startsWith('2026'));
            if (dates2026.length > 0) {
              console.log(`  ⭐ 2026 dates found: ${dates2026.length}`);
              console.log(`  2026 dates: ${dates2026.map(d => d.date).join(', ')}`);
            }
          }
        }
      } catch (e) {
        // Skip errors
      }
    }
  }
}

testScheduleIds().catch(console.error);
