import { PrismaClient } from '@prisma/client';
import { emitPointsUpdate, emitLeaderboardUpdate } from '../sockets';

const prisma = new PrismaClient();

const SCORING = {
  GOAL: 10,
  ASSIST: 5,
  CLEAN_SHEET: 4,
  YELLOW_CARD: -2,
  RED_CARD: -5,
  PENALTY_MISS: -4,
};

export async function calculatePlayerPoints(matchPlayerId: string): Promise<number> {
  const mp = await prisma.matchPlayer.findUnique({ where: { id: matchPlayerId }, include: { player: true } });
  if (!mp) return 0;

  let points = 0;
  points += mp.goals * SCORING.GOAL;
  points += mp.assists * SCORING.ASSIST;
  points += mp.yellowCards * SCORING.YELLOW_CARD;
  points += mp.redCards * SCORING.RED_CARD;
  points += mp.penaltyMisses * SCORING.PENALTY_MISS;

  // Clean sheet only for GK and DEF
  if (mp.cleanSheet && (mp.player.position === 'GK' || mp.player.position === 'DEF')) {
    points += SCORING.CLEAN_SHEET;
  }

  return points;
}

export async function calculateTeamPoints(fantasyTeamId: string): Promise<number> {
  const team = await prisma.fantasyTeam.findUnique({
    where: { id: fantasyTeamId },
    include: {
      teamPlayers: {
        include: {
          player: {
            include: {
              matchPlayers: { where: { matchId: '' } }, // placeholder, we fill below
            },
          },
        },
      },
    },
  });
  if (!team) return 0;

  // Fetch match players for the right match
  const teamPlayersWithPoints = await prisma.teamPlayer.findMany({
    where: { fantasyTeamId },
    include: {
      player: {
        include: {
          matchPlayers: { where: { matchId: team.matchId } },
        },
      },
    },
  });

  let totalPoints = 0;

  for (const tp of teamPlayersWithPoints) {
    const mp = tp.player.matchPlayers[0];
    if (!mp) continue;

    let pts = 0;
    pts += mp.goals * SCORING.GOAL;
    pts += mp.assists * SCORING.ASSIST;
    pts += mp.yellowCards * SCORING.YELLOW_CARD;
    pts += mp.redCards * SCORING.RED_CARD;
    pts += mp.penaltyMisses * SCORING.PENALTY_MISS;
    if (mp.cleanSheet && (tp.player.position === 'GK' || tp.player.position === 'DEF')) {
      pts += SCORING.CLEAN_SHEET;
    }

    // Apply captain/vc multipliers
    if (tp.playerId === team.captainId) {
      pts = Math.round(pts * 2);
    } else if (tp.playerId === team.viceCaptainId) {
      pts = Math.round(pts * 1.5);
    }

    totalPoints += pts;
  }

  // Update the fantasy team record
  await prisma.fantasyTeam.update({
    where: { id: fantasyTeamId },
    data: { totalPoints },
  });

  return totalPoints;
}

export async function recalculateMatchPoints(matchId: string): Promise<void> {
  // Recalculate all match player points first
  const matchPlayers = await prisma.matchPlayer.findMany({ where: { matchId }, include: { player: true } });

  for (const mp of matchPlayers) {
    let points = 0;
    points += mp.goals * SCORING.GOAL;
    points += mp.assists * SCORING.ASSIST;
    points += mp.yellowCards * SCORING.YELLOW_CARD;
    points += mp.redCards * SCORING.RED_CARD;
    points += mp.penaltyMisses * SCORING.PENALTY_MISS;
    if (mp.cleanSheet && (mp.player.position === 'GK' || mp.player.position === 'DEF')) {
      points += SCORING.CLEAN_SHEET;
    }

    await prisma.matchPlayer.update({
      where: { id: mp.id },
      data: { fantasyPoints: points },
    });
  }

  // Recalculate all fantasy teams for this match
  const fantasyTeams = await prisma.fantasyTeam.findMany({
    where: { matchId },
    include: {
      teamPlayers: {
        include: {
          player: { include: { matchPlayers: { where: { matchId } } } },
        },
      },
    },
  });

  for (const team of fantasyTeams) {
    let totalPoints = 0;

    for (const tp of team.teamPlayers) {
      const mp = tp.player.matchPlayers[0];
      if (!mp) continue;

      let pts = mp.fantasyPoints;

      if (tp.playerId === team.captainId) {
        pts = Math.round(pts * 2);
      } else if (tp.playerId === team.viceCaptainId) {
        pts = Math.round(pts * 1.5);
      }

      totalPoints += pts;
    }

    await prisma.fantasyTeam.update({
      where: { id: team.id },
      data: { totalPoints },
    });

    // Update user total points
    const allTeams = await prisma.fantasyTeam.findMany({
      where: { userId: team.userId },
      select: { totalPoints: true },
    });
    const userTotal = allTeams.reduce((sum, t) => sum + t.totalPoints, 0);
    await prisma.user.update({ where: { id: team.userId }, data: { totalPoints: userTotal } });

    // Emit real-time points update
    emitPointsUpdate(team.userId, matchId, totalPoints);
  }

  // Find all leagues that have members who played this match
  const leagueIds = await prisma.leagueMember.findMany({
    where: {
      userId: { in: fantasyTeams.map((t) => t.userId) },
    },
    select: { leagueId: true },
    distinct: ['leagueId'],
  });

  for (const { leagueId } of leagueIds) {
    emitLeaderboardUpdate(leagueId);
  }
}
