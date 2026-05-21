import { Router } from 'express';
import { getAllPlayers, getPlayer, getPlayersByMatch } from '../controllers/player.controller';

const router = Router();

router.get('/', getAllPlayers);
router.get('/match/:matchId', getPlayersByMatch);
router.get('/:id', getPlayer);

export default router;
