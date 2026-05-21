import { Router } from 'express';
import { getGlobalLeaderboard, getMatchLeaderboard, getLeagueLeaderboard } from '../controllers/leaderboard.controller';

const router = Router();

router.get('/global', getGlobalLeaderboard);
router.get('/match/:matchId', getMatchLeaderboard);
router.get('/league/:leagueId', getLeagueLeaderboard);

export default router;
