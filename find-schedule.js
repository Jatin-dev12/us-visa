#!/usr/bin/env node

import { VisaHttpClient } from './src/lib/client.js';
import { getConfig } from './src/lib/config.js';
import fetch from 'node-fetch';
import fs from 'fs';

async function findScheduleDeep() {
  try {
    console.log('🔍 DEEP SEARCH FOR SCHEDULE IDs\n');
    
    const config = getConfig();
    console.log('Email:', config.email);
    console.log('Country:', config.countryCode.toUpperCase());
    
    const client = new VisaHttpClient(config.countryCode, config.email, config.password);
    console.log('\n🔐 Logging in...');
    const sessionHeaders = await client.login();
    console.log('✅ Login successful!\n');
    
    // Try multiple pages to find schedule IDs
    const pagesToCheck = [
      `/en-${config.countryCode}/niv/groups`,
      `/en-${config.countryCode}/niv/account`,
      `/en-${config.countryCode}/niv/schedule/${config.scheduleId}/appointment`,
      `/en-${config.countryCode}/niv/schedule/${config.scheduleId}/continue_actions`
    ];
    
    const foundScheduleIds = new Set();
    
    for (const page of pagesToCheck) {
      try {
        console.log(`Checking: ${page}`);
        const url = `https://ais.usvisa-info.com${page}`;
        const response = await fetch(url, { headers: sessionHeaders });
        const html = await response.text();
        
        // Find all schedule IDs in the HTML
        const matches = html.matchAll(/\/schedule\/(\d{8})/g);
        for (const match of matches) {
          foundScheduleIds.add(match[1]);
        }
        
        // Also check for data attributes
        const dataMatches = html.matchAll(/data-schedule[_-]?id["\s]*[:=]["\s]*(\d{8})/gi);
        for (const match of dataMatches) {
          foundScheduleIds.add(match[1]);
        }
      } catch (e) {
        // Skip errors
      }
    }
    
    console.log('\n📋 Found Schedule IDs:', Array.from(foundScheduleIds));
    
    if (foundScheduleIds.size === 0) {
      console.log('\n⚠️  No schedule IDs found automatically.');
      console.log('Let me try a range of possible IDs...\n');
      
      // Try a range around the current schedule ID
      const baseId = parseInt(config.scheduleId);
      const testIds = [];
      for (let i = -10; i <= 10; i++) {
        testIds.push((baseId + i * 100000).toString());
      }
      
      foundScheduleIds.add(config.scheduleId);
      testIds.forEach(id => foundScheduleIds.add(id));
    }
    
    console.log('\n🧪 Testing Schedule IDs with Facility IDs...\n');
    
    const facilityIds = ['89', '90', '91', '92', '93', '94', '95'];
    const validCombinations = [];
    
    for (const scheduleId of foundScheduleIds) {
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
              validCombinations.push({
                scheduleId,
                facilityId,
                dates: dates.length,
                firstDate: dates[0].date,
                lastDate: dates[dates.length - 1].date,
                has2026: dates.some(d => d.date.startsWith('2026'))
              });
            }
          }
        } catch (e) {
          // Skip
        }
      }
    }
    
    if (validCombinations.length === 0) {
      console.log('❌ No valid combinations found!');
      console.log('\n💡 This could mean:');
      console.log('   1. You don\'t have any appointments scheduled yet');
      console.log('   2. Your account doesn\'t have access to book appointments');
      console.log('   3. The schedule ID in your account is different\n');
      return;
    }
    
    console.log('✅ FOUND VALID COMBINATIONS:\n');
    console.log('='.repeat(70));
    
    validCombinations.forEach((combo, index) => {
      console.log(`\n${index + 1}. Schedule ID: ${combo.scheduleId} | Facility ID: ${combo.facilityId}`);
      console.log(`   📅 Dates: ${combo.dates} available`);
      console.log(`   📆 Range: ${combo.firstDate} to ${combo.lastDate}`);
      if (combo.has2026) {
        console.log(`   ⭐ HAS 2026 DATES!`);
      } else {
        console.log(`   ⚠️  No 2026 dates`);
      }
    });
    
    // Find best combination
    const best = validCombinations.reduce((a, b) => a.dates > b.dates ? a : b);
    
    console.log('\n' + '='.repeat(70));
    console.log('📝 RECOMMENDED .ENV CONFIGURATION:\n');
    console.log(`EMAIL=${config.email}`);
    console.log(`PASSWORD=${config.password}`);
    console.log(`COUNTRY_CODE=${config.countryCode}`);
    console.log(`SCHEDULE_ID=${best.scheduleId}`);
    console.log(`FACILITY_ID=${best.facilityId}`);
    console.log(`REFRESH_DELAY=3`);
    console.log(`\n✨ Best option: ${best.dates} dates available`);
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
  }
}

findScheduleDeep();
