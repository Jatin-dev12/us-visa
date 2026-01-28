#!/usr/bin/env node

import { VisaHttpClient } from './src/lib/client.js';
import { getConfig } from './src/lib/config.js';

async function debugDates() {
  const config = getConfig();
  const client = new VisaHttpClient(config.countryCode, config.email, config.password);
  
  console.log('Logging in...');
  const sessionHeaders = await client.login();
  console.log('Login successful!\n');
  
  // Check non-expedited dates
  console.log('=== NON-EXPEDITED APPOINTMENTS ===');
  const url1 = `https://ais.usvisa-info.com/en-${config.countryCode}/niv/schedule/${config.scheduleId}/appointment/days/${config.facilityId}.json?appointments[expedite]=false`;
  console.log('URL:', url1);
  
  const response1 = await fetch(url1, {
    headers: {
      ...sessionHeaders,
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    }
  });
  const dates1 = await response1.json();
  console.log('Total dates found:', dates1.length);
  
  if (dates1.length > 0) {
    console.log('First date:', dates1[0].date);
    console.log('Last date:', dates1[dates1.length - 1].date);
    
    // Group dates by year
    const datesByYear = {};
    dates1.forEach(d => {
      const year = d.date.substring(0, 4);
      if (!datesByYear[year]) datesByYear[year] = [];
      datesByYear[year].push(d.date);
    });
    
    console.log('\n📅 ALL AVAILABLE DATES BY YEAR:');
    console.log('='.repeat(60));
    Object.keys(datesByYear).sort().forEach(year => {
      console.log(`\n${year}: ${datesByYear[year].length} dates`);
      console.log(datesByYear[year].join(', '));
    });
    console.log('='.repeat(60));
  } else {
    console.log('No dates available');
  }
  
  // Check expedited dates
  console.log('\n=== EXPEDITED APPOINTMENTS ===');
  const url2 = `https://ais.usvisa-info.com/en-${config.countryCode}/niv/schedule/${config.scheduleId}/appointment/days/${config.facilityId}.json?appointments[expedite]=true`;
  console.log('URL:', url2);
  
  const response2 = await fetch(url2, {
    headers: {
      ...sessionHeaders,
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    }
  });
  const dates2 = await response2.json();
  console.log('Total dates found:', dates2.length);
  
  if (dates2.length > 0) {
    console.log('First date:', dates2[0].date);
    console.log('Last date:', dates2[dates2.length - 1].date);
    
    // Group dates by year
    const datesByYear = {};
    dates2.forEach(d => {
      const year = d.date.substring(0, 4);
      if (!datesByYear[year]) datesByYear[year] = [];
      datesByYear[year].push(d.date);
    });
    
    console.log('\n📅 ALL AVAILABLE DATES BY YEAR:');
    console.log('='.repeat(60));
    Object.keys(datesByYear).sort().forEach(year => {
      console.log(`\n${year}: ${datesByYear[year].length} dates`);
      console.log(datesByYear[year].join(', '));
    });
    console.log('='.repeat(60));
  } else {
    console.log('No dates available');
  }
}

debugDates().catch(console.error);
