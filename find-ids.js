#!/usr/bin/env node

import { VisaHttpClient } from './src/lib/client.js';
import { getConfig } from './src/lib/config.js';
import cheerio from 'cheerio';
import fetch from 'node-fetch';
import fs from 'fs';

async function findIds() {
  try {
    const config = getConfig();
    console.log('Finding your Schedule ID and Facility ID...\n');
    
    const client = new VisaHttpClient(config.countryCode, config.email, config.password);
    const sessionHeaders = await client.login();
    
    console.log('✓ Login successful!\n');
    
    // Try the appointment page directly
    const appointmentUrl = `https://ais.usvisa-info.com/en-${config.countryCode}/niv/schedule/${config.scheduleId}/appointment`;
    console.log('Fetching appointment page:', appointmentUrl);
    
    const response = await fetch(appointmentUrl, {
      headers: sessionHeaders
    });
    
    console.log('Response status:', response.status);
    
    const html = await response.text();
    
    // Save HTML for inspection
    fs.writeFileSync('appointment-page.html', html);
    console.log('✓ Saved page to appointment-page.html\n');
    
    const $ = cheerio.load(html);
    
    // Look for facility select dropdown
    console.log('Looking for facility IDs...\n');
    $('select option').each((i, elem) => {
      const value = $(elem).attr('value');
      const text = $(elem).text().trim();
      if (value && text) {
        console.log(`Facility ID: ${value} - ${text}`);
      }
    });
    
    // Look for any schedule references
    console.log('\nLooking for schedule references...\n');
    $('a[href*="/schedule/"]').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      console.log(`Link: ${href}`);
      console.log(`Text: ${text}`);
      console.log('---');
    });
    
    // Check for data attributes
    console.log('\nLooking for data attributes...\n');
    $('[data-facility-id], [data-schedule-id]').each((i, elem) => {
      console.log('Element:', elem.name);
      console.log('Facility ID:', $(elem).attr('data-facility-id'));
      console.log('Schedule ID:', $(elem).attr('data-schedule-id'));
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  }
}

findIds();
