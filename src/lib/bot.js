import { VisaHttpClient } from './client.js';
import { log } from './utils.js';

export class Bot {
  constructor(config, options = {}) {
    this.config = config;
    this.dryRun = options.dryRun || false;
    this.client = new VisaHttpClient(this.config.countryCode, this.config.email, this.config.password);
  }

  async initialize() {
    log('Initializing visa bot...');
    return await this.client.login();
  }

  async checkAvailableDate(sessionHeaders, currentBookedDate, minDate, targetDate) {
    const dates = await this.client.checkAvailableDate(
      sessionHeaders,
      this.config.scheduleId,
      this.config.facilityId
    );

    if (!dates || dates.length === 0) {
      log("no dates available");
      return null;
    }

    log(`found ${dates.length} available dates: ${dates.join(', ')}`);

    // Filter dates based on criteria
    const goodDates = dates.filter(date => {
      // Only filter out dates that are on or after current booked date
      if (date >= currentBookedDate) {
        log(`date ${date} is not earlier than current booking (${currentBookedDate})`);
        return false;
      }

      if (minDate && date < minDate) {
        log(`date ${date} is before minimum date (${minDate})`);
        return false;
      }

      if (targetDate && date > targetDate) {
        log(`date ${date} is after target date (${targetDate})`);
        return false;
      }

      return true;
    });

    if (goodDates.length === 0) {
      log("no good dates found after filtering");
      return null;
    }

    // Sort dates and return the earliest one
    goodDates.sort();
    const earliestDate = goodDates[0];
    
    log(`found ${goodDates.length} good dates after filtering: ${goodDates.join(', ')}, using earliest: ${earliestDate}`);
    return earliestDate;
  }

  async bookAppointment(sessionHeaders, date) {
    const time = await this.client.checkAvailableTime(
      sessionHeaders,
      this.config.scheduleId,
      this.config.facilityId,
      date
    );

    if (!time) {
      log(`no available time slots for date ${date}`);
      return false;
    }

    if (this.dryRun) {
      log(`[DRY RUN] Would book appointment at ${date} ${time} (not actually booking)`);
      return true;
    }

    log(`Attempting to book appointment at ${date} ${time}...`);
    
    // Retry booking up to 3 times if socket hang up occurs
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.client.book(
          sessionHeaders,
          this.config.scheduleId,
          this.config.facilityId,
          date,
          time
        );

        log(`booked time at ${date} ${time}`);
        log(`Booking response status: ${response.status}`);
        log(`Booking response URL: ${response.url}`);
        
        // Check if booking was successful by checking the redirect URL
        if (response.url.includes('/continue_actions')) {
          log(`✅ BOOKING CONFIRMED! Appointment successfully booked for ${date} ${time}`);
          return true;
        } else {
          log(`⚠️ Booking may have failed. Response URL: ${response.url}`);
          return false;
        }
      } catch (error) {
        if (error.message.includes('socket hang up') && attempt < maxRetries) {
          log(`⚠️ Socket hang up on attempt ${attempt}/${maxRetries}. Retrying in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
        log(`❌ Error booking appointment: ${error.message}`);
        return false;
      }
    }
    
    log(`❌ Failed to book after ${maxRetries} attempts`);
    return false;
  }

}
