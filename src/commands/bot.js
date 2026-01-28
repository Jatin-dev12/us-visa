import { Bot } from '../lib/bot.js';
import { getConfig } from '../lib/config.js';
import { log, sleep, isSocketHangupError } from '../lib/utils.js';

const RETRY_DELAY = 5; // 5 seconds retry delay for errors

export async function botCommand(options) {
  const config = getConfig();
  const bot = new Bot(config, { dryRun: options.dryRun });
  let currentBookedDate = options.current;
  const targetDate = options.target;
  const minDate = options.min;

  log(`Initializing with current date ${currentBookedDate}`);

  if (options.dryRun) {
    log(`[DRY RUN MODE] Bot will only log what would be booked without actually booking`);
  }

  if (targetDate) {
    log(`Target date: ${targetDate}`);
  }

  if (minDate) {
    log(`Minimum date: ${minDate}`);
  }

  try {
    const sessionHeaders = await bot.initialize();

    while (true) {
      try {
        const availableDate = await bot.checkAvailableDate(
          sessionHeaders,
          currentBookedDate,
          minDate,
          targetDate
        );

        if (availableDate) {
          const booked = await bot.bookAppointment(sessionHeaders, availableDate);

          if (booked) {
            // Update current date to the new available date
            currentBookedDate = availableDate;

            options = {
              ...options,
              current: currentBookedDate
            };

            if (targetDate && availableDate <= targetDate) {
              log(`Target date reached! Successfully booked appointment on ${availableDate}`);
              process.exit(0);
            }
            
            log(`Booked ${availableDate}, but continuing to monitor for better dates...`);
          }
        } else {
          log(`No matching dates found. Checking again in ${config.refreshDelay} seconds...`);
        }

        await sleep(config.refreshDelay);
      } catch (loopErr) {
        // Handle errors within the loop without stopping
        log(`Error in check loop: ${loopErr.message}. Retrying in ${RETRY_DELAY} seconds...`);
        await sleep(RETRY_DELAY);
        // Continue the loop
      }
    }
  } catch (err) {
    if (isSocketHangupError(err)) {
      log(`Socket hangup error: ${err.message}. Retrying in ${RETRY_DELAY} seconds...`);
      await sleep(RETRY_DELAY);
    } else {
      log(`Error: ${err.message}. Retrying in ${RETRY_DELAY} seconds...`);
      await sleep(RETRY_DELAY);
    }
    return botCommand(options);
  }
}
