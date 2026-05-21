import { Router } from 'express';
import { saveTeam, getMyTeam } from '../controllers/team.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateSaveTeam } from '../middleware/validators';

const router = Router();

router.use(authenticate);

router.post('/', validateSaveTeam, saveTeam);
router.get('/:matchId', getMyTeam);

export default router;
