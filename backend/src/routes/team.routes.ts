import { Router } from 'express';
import { saveTeam, getMyTeam } from '../controllers/team.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', saveTeam);
router.get('/:matchId', getMyTeam);

export default router;
