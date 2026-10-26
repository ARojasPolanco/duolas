import webpush from 'web-push';
import { envs } from './enviroments.js';

export const pushEnabled = Boolean(envs.VAPID_PUBLIC_KEY && envs.VAPID_PRIVATE_KEY);

if (pushEnabled) {
  webpush.setVapidDetails(
    envs.VAPID_SUBJECT || 'mailto:soporte@duolas.app',
    envs.VAPID_PUBLIC_KEY,
    envs.VAPID_PRIVATE_KEY
  );
}

export { webpush };
