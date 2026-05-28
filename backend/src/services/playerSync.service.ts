import prisma from '../lib/prisma';

/**
 * Daily cron job: Adjusts player prices based on recent fantasy points.
 * Players who perform well get a price bump; underperformers get cheaper.
 * Price floor: 4.0, Price ceiling: 15.0
 */
export async function syncPlayerPrices(): Promise<void> {
  console.log('[PlayerSync] Starting daily price adjustment...');

  try {
    // Get all players with their recent match performance
    const players = await prisma.player.findMany({
      include: {
        matchPlayers: {
          orderBy: { match: { kickoffTime: 'desc' } },
          take: 5, // Last 5 matches
          select: { fantasyPoints: true },
        },
      },
    });

    let updated = 0;

    for (const player of players) {
      if (player.matchPlayers.length === 0) continue;

      const avgPoints = player.matchPlayers.reduce((sum, mp) => sum + mp.fantasyPoints, 0) / player.matchPlayers.length;

      let priceChange = 0;
      if (avgPoints >= 10) priceChange = 0.5;       // Excellent form
      else if (avgPoints >= 7) priceChange = 0.3;    // Good form
      else if (avgPoints >= 4) priceChange = 0.1;    // Average
      else if (avgPoints >= 1) priceChange = -0.1;   // Below average
      else priceChange = -0.3;                        // Poor form

      const newPrice = Math.max(4.0, Math.min(15.0, player.price + priceChange));

      if (newPrice !== player.price) {
        await prisma.player.update({
          where: { id: player.id },
          data: { price: parseFloat(newPrice.toFixed(1)) },
        });
        updated++;
      }
    }

    console.log(`[PlayerSync] Updated ${updated} player prices.`);
  } catch (e) {
    console.error('[PlayerSync] Price sync failed:', e);
    throw e;
  }
}
