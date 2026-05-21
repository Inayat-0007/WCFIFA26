import { Router } from 'express';
import {
  getAllUsers, getAllLeagues, updateMatchScore, addMatchEvent,
  updatePlayer, triggerScoreRecalc, getAdminStats
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { adminLimiter } from '../middleware/rateLimit.middleware';
import { validateUpdateScore, validateAddEvent, validateUpdatePlayer } from '../middleware/validators';

const router = Router();

router.use(authenticate, requireAdmin, adminLimiter);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/leagues', getAllLeagues);
router.patch('/matches/:id/score', validateUpdateScore, updateMatchScore);
router.post('/matches/:matchId/events', validateAddEvent, addMatchEvent);
router.patch('/players/:id', validateUpdatePlayer, updatePlayer);
router.post('/matches/:matchId/recalculate', triggerScoreRecalc);

export default router;
