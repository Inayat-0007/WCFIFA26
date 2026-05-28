import prisma from '../lib/prisma';
import { emitPointsUpdate, emitLeaderboardUpdate } from '../sockets';


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
  // Get the team to find which match it belongs to
  const team = await prisma.fantasyTeam.findUnique({
    where: { id: fantasyTeamId },
    select: { id: true, matchId: true, captainId: true, viceCaptainId: true },
  });
  if (!team) return 0;

  // Fetch team players with their match-specific stats in a single query
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
  await prisma.$transaction(async (tx) => {
    // Recalculate all match player points first
    const matchPlayers = await tx.matchPlayer.findMany({ where: { matchId }, include: { player: true } });

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

      await tx.matchPlayer.update({
        where: { id: mp.id },
        data: { fantasyPoints: points },
      });
    }

    // Recalculate all fantasy teams for this match
    const fantasyTeams = await tx.fantasyTeam.findMany({
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

        // Compute points using the updated values computed in this transaction
        let pts = 0;
        pts += mp.goals * SCORING.GOAL;
        pts += mp.assists * SCORING.ASSIST;
        pts += mp.yellowCards * SCORING.YELLOW_CARD;
        pts += mp.redCards * SCORING.RED_CARD;
        pts += mp.penaltyMisses * SCORING.PENALTY_MISS;
        if (mp.cleanSheet && (tp.player.position === 'GK' || tp.player.position === 'DEF')) {
          pts += SCORING.CLEAN_SHEET;
        }

        if (tp.playerId === team.captainId) {
          pts = Math.round(pts * 2);
        } else if (tp.playerId === team.viceCaptainId) {
          pts = Math.round(pts * 1.5);
        }

        totalPoints += pts;
      }

      await tx.fantasyTeam.update({
        where: { id: team.id },
        data: { totalPoints },
      });

      // Update user total points
      const allTeams = await tx.fantasyTeam.findMany({
        where: { userId: team.userId },
        select: { totalPoints: true },
      });
      const userTotal = allTeams.reduce((sum, t) => sum + t.totalPoints, 0);
      await tx.user.update({ where: { id: team.userId }, data: { totalPoints: userTotal } });
    }
  });

  // Since transactions are atomic, once it succeeds, we fetch the updated teams to broadcast sockets
  const updatedTeams = await prisma.fantasyTeam.findMany({
    where: { matchId },
    select: { userId: true, totalPoints: true },
  });

  for (const team of updatedTeams) {
    emitPointsUpdate(team.userId, matchId, team.totalPoints);
  }

  // Find all leagues that have members who played this match
  const leagueIds = await prisma.leagueMember.findMany({
    where: {
      userId: { in: updatedTeams.map((t) => t.userId) },
    },
    select: { leagueId: true },
    distinct: ['leagueId'],
  });

  for (const { leagueId } of leagueIds) {
    emitLeaderboardUpdate(leagueId);
  }
}
