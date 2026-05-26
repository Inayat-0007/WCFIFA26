import { Request, Response, NextFunction } from 'express';
import webpush from 'web-push';
import prisma from '../lib/prisma';

// Initialize web-push with VAPID keys from environment
const setupWebPush = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const mailTo = process.env.VAPID_MAILTO || 'mailto:admin@worldcupfantasy.com';

  if (publicKey && privateKey && !publicKey.startsWith('your_') && !privateKey.startsWith('your_')) {
    webpush.setVapidDetails(mailTo, publicKey, privateKey);
    return true;
  }
  return false;
};

export const getVapidPublicKey = async (req: Request, res: Response): Promise<void> => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  if (!publicKey || publicKey.startsWith('your_')) {
    res.status(404).json({ success: false, message: 'VAPID public key not configured' });
    return;
  }
  res.json({ success: true, publicKey });
};

export const subscribe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.auth || !keys.p256dh) {
      res.status(400).json({ success: false, message: 'Invalid subscription object' });
      return;
    }

    // Save or update subscription
    const subscription = await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: req.user!.id,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
      create: {
        userId: req.user!.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    res.status(201).json({ success: true, data: subscription, message: 'Successfully subscribed to push notifications!' });
  } catch (err) {
    next(err);
  }
};

export const sendTestNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const isConfigured = setupWebPush();
    if (!isConfigured) {
      res.status(500).json({ success: false, message: 'Web Push is not fully configured on the server. VAPID keys are missing.' });
      return;
    }

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: req.user!.id },
    });

    if (subscriptions.length === 0) {
      res.status(404).json({ success: false, message: 'No push subscriptions found for this user.' });
      return;
    }

    const payload = JSON.stringify({
      title: '⚽ World Cup Fantasy 2026',
      body: 'Your push notifications are configured correctly! Let the games begin!',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: '/dashboard' }
    });

    let successCount = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256dh,
          },
        };
        await webpush.sendNotification(pushSubscription, payload);
        successCount++;
      } catch (err: any) {
        // If subscription is expired or invalid, remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        } else {
          errors.push(err.message || 'Unknown push error');
        }
      }
    }

    res.json({
      success: true,
      message: `Sent test notification to ${successCount} devices.`,
      failures: errors.length,
      errors
    });
  } catch (err) {
    next(err);
  }
};

// Helper function to send push notification to any user across the backend
export const sendPushToUser = async (userId: string, title: string, body: string, url: string = '/dashboard'): Promise<boolean> => {
  try {
    const isConfigured = setupWebPush();
    if (!isConfigured) return false;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId },
    });

    if (subscriptions.length === 0) return false;

    const payload = JSON.stringify({
      title,
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url }
    });

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            auth: sub.auth,
            p256dh: sub.p256dh,
          },
        };
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }
    return true;
  } catch {
    return false;
  }
};
