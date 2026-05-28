import cron from 'node-cron';
import { syncEventsForLiveMatches } from './footballApi.service';
import { syncPlayerPrices } from './playerSync.service';

/**
 * Initializes and schedules all background cron tasks.
 */
export function setupCronJobs(): void {
  console.log('[Cron] Initializing background task schedulers...');

  // CRON: Sync live match data every 60 seconds
  cron.schedule('* * * * *', async () => {
    if (process.env.FOOTBALL_API_KEY) {
      try {
        console.log('[Cron] Triggering live match score & event sync...');
        await syncEventsForLiveMatches();
      } catch (err) {
        console.error('[Cron] Live match sync error:', err);
      }
    }
  });

  // CRON: Update player prices daily at 03:00 UTC
  cron.schedule('0 3 * * *', async () => {
    try {
      console.log('[Cron] Triggering daily player price fluctuations...');
      await syncPlayerPrices();
    } catch (err) {
      console.error('[Cron] Player price sync error:', err);
    }
  });

  console.log('[Cron] Scheduled: Live Match Sync (every 60s), Player Price Adjuster (daily at 03:00 UTC)');
}
