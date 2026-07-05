import webpush from 'web-push';
import User from '../models/User.js';

// Initialize web-push with VAPID keys
// In production, these should be in .env
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BLmd-rNScVaLovPO04dQWFT54B0jgpHhyu1wk-lroXv7-C23M16JvH6vu0s0CL5DoOEST_GGyQtlC4LllmCbdCc';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'FIKQWKEnzk4PTREd3kuw1uNc2urq4kxNiFhbZ0hpULA';
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@legacyacademy.com';

webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
);

/**
 * Send a web push notification to a user's registered devices.
 * 
 * @param {String} userId - The ID of the user to notify
 * @param {Object} payload - The notification payload (title, body, url, icon, etc.)
 */
export const sendWebPushNotification = async (userId, payload) => {
    try {
        const user = await User.findById(userId);
        if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
            return; // User has no registered devices
        }

        const subscriptions = user.pushSubscriptions;
        const payloadString = JSON.stringify(payload);

        // Send to all registered devices for this user
        const promises = subscriptions.map(async (subscription) => {
            try {
                await webpush.sendNotification(subscription, payloadString);
            } catch (error) {
                // If subscription is invalid/expired (status 410 or 404), remove it from DB
                if (error.statusCode === 410 || error.statusCode === 404) {
                    await User.findByIdAndUpdate(userId, {
                        $pull: { pushSubscriptions: { endpoint: subscription.endpoint } }
                    });
                } else {
                    console.error('Web Push Error:', error);
                }
            }
        });

        await Promise.all(promises);
    } catch (err) {
        console.error('Failed to send push notification:', err);
    }
};

export { vapidPublicKey };
