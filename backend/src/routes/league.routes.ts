import { Router } from 'express';
import { createLeague, joinLeague, getMyLeagues, getLeague, getLeagueLeaderboard, leaveLeague, removeMember, deleteLeague } from '../controllers/league.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateCreateLeague, validateJoinLeague } from '../middleware/validators';

const router = Router();

router.use(authenticate);

router.get('/', getMyLeagues);
router.post('/', validateCreateLeague, createLeague);
router.post('/join', validateJoinLeague, joinLeague);
router.get('/:id', getLeague);
router.get('/:id/leaderboard', getLeagueLeaderboard);
router.delete('/:id/leave', leaveLeague);
router.delete('/:id/members/:userId', removeMember);
router.delete('/:id', deleteLeague);

export default router;
