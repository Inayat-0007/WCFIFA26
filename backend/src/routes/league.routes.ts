import { Router } from 'express';
import { createLeague, joinLeague, getMyLeagues, getLeague, getLeagueLeaderboard, leaveLeague, removeMember, deleteLeague } from '../controllers/league.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getMyLeagues);
router.post('/', createLeague);
router.post('/join', joinLeague);
router.get('/:id', getLeague);
router.get('/:id/leaderboard', getLeagueLeaderboard);
router.delete('/:id/leave', leaveLeague);
router.delete('/:id/members/:userId', removeMember);
router.delete('/:id', deleteLeague);

export default router;
