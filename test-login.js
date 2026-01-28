#!/usr/bin/env node

import { VisaHttpClient } from './src/lib/client.js';
import { getConfig } from './src/lib/config.js';

async function testLogin() {
  try {
    const config = getConfig();
    console.log('Testing login with:');
    console.log('Email:', config.email);
    console.log('Country Code:', config.countryCode);
    console.log('Schedule ID:', config.scheduleId);
    console.log('Facility ID:', config.facilityId);
    console.log('\nAttempting login...');
    
    const client = new VisaHttpClient(config.countryCode, config.email, config.password);
    const sessionHeaders = await client.login();
    
    console.log('✓ Login successful!');
    console.log('Session headers received:', Object.keys(sessionHeaders));
    
    // Test fetching dates
    console.log('\nTesting date fetch...');
    const url = `https://ais.usvisa-info.com/en-${config.countryCode}/niv/schedule/${config.scheduleId}/appointment/days/${config.facilityId}.json?appointments[expedite]=false`;
    console.log('URL:', url);
    
    const response = await fetch(url, {
      headers: {
        ...sessionHeaders,
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('Response body:', text.substring(0, 500));
    
    if (response.status === 200 && text) {
      try {
        const dates = JSON.parse(text);
        console.log('✓ Successfully fetched dates!');
        console.log('Total dates available:', dates.length);
        if (dates.length > 0) {
          console.log('First date:', dates[0]);
          console.log('Last date:', dates[dates.length - 1]);
        }
      } catch (e) {
        console.error('Failed to parse JSON:', e.message);
      }
    }
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    console.error('Full error:', error);
  }
}

testLogin();
