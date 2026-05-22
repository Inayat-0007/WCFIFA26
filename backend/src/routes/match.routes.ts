import { Router } from 'express';
import { getAllMatches, getMatch, getLiveMatches, getUpcomingMatches } from '../controllers/match.controller';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', optionalAuth, getAllMatches);
router.get('/live', optionalAuth, getLiveMatches);
router.get('/upcoming', optionalAuth, getUpcomingMatches);
router.get('/:id', optionalAuth, getMatch);

export default router;
