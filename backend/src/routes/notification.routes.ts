import { Router } from 'express';
import { getVapidPublicKey, subscribe, sendTestNotification } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/vapid-key', getVapidPublicKey);
router.post('/subscribe', authenticate, subscribe);
router.post('/test', authenticate, sendTestNotification);

export default router;
