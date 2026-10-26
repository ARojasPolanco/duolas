import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../config/api.js';
import { isIos, isStandalone, registerServiceWorker, urlBase64ToUint8Array } from '../utils/pwa.js';

const supported =
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export default function usePush() {
  const { token } = useAuth();
  const [available, setAvailable] = useState(false);
  const [publicKey, setPublicKey] = useState(null);
  const [permission, setPermission] = useState(supported ? Notification.permission : 'unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(Boolean(token));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token || !localStorage.getItem('token')) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      await registerServiceWorker();
      const keyRes = await api.get('/v1/push/public-key');
      const key = keyRes.data.publicKey || null;
      setPublicKey(key);
      setAvailable(Boolean(key));
      setPermission(supported ? Notification.permission : 'unsupported');

      if (supported) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setSubscribed(Boolean(subscription));
      }

      setError('');
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'No pudimos preparar las notificaciones push.'
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const subscribe = useCallback(async () => {
    if (!supported || !publicKey) return;

    setBusy(true);
    setError('');

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setError('El permiso de notificaciones fue denegado.');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existing = await registration.pushManager.getSubscription();

      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const serialized = subscription.toJSON();

      await api.post('/v1/push/subscribe', {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: serialized.keys.p256dh,
          auth: serialized.keys.auth,
        },
        userAgent: navigator.userAgent.slice(0, 255),
      });

      setSubscribed(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos activar las notificaciones.');
    } finally {
      setBusy(false);
    }
  }, [publicKey]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;

    setBusy(true);
    setError('');

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await api.delete('/v1/push/unsubscribe', {
          data: { endpoint: subscription.endpoint },
        });
        await subscription.unsubscribe();
      }

      setSubscribed(false);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos desactivar las notificaciones.');
    } finally {
      setBusy(false);
    }
  }, []);

  return {
    supported,
    available,
    subscribed,
    permission,
    loading,
    busy,
    error,
    ios: typeof navigator !== 'undefined' && isIos(),
    standalone: typeof window !== 'undefined' && isStandalone(),
    refresh: load,
    subscribe,
    unsubscribe,
  };
}
