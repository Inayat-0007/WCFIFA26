import { Router } from 'express';
import { getUserAchievements, getUserHistory } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/achievements', authenticate, getUserAchievements);
router.get('/history', authenticate, getUserHistory);

export default router;
