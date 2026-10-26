import { useEffect, useRef, useState } from 'react';
import api from '../config/api.js';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const POLL_MS = 20 * 1000;
const MAX_FAILURES = 2;

export default function useSSE({ enabled, onEvent, onPoll }) {
  const [status, setStatus] = useState('idle');
  const onEventRef = useRef(onEvent);
  const onPollRef = useRef(onPoll);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onPollRef.current = onPoll;
  }, [onPoll]);

  useEffect(() => {
    if (!enabled || !localStorage.getItem('token')) {
      setStatus('idle');
      return undefined;
    }

    let closed = false;
    let source = null;
    let reconnectTimer = null;
    let pollTimer = null;
    let failures = 0;

    const clearPolling = () => {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    };

    const startPolling = () => {
      if (pollTimer) return;
      setStatus('polling');
      onPollRef.current?.();
      pollTimer = setInterval(() => {
        onPollRef.current?.();
      }, POLL_MS);
    };

    const handleNotification = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onEventRef.current?.(payload);
      } catch (_error) {
        onEventRef.current?.(null);
      }
    };

    const connect = async () => {
      if (closed) return;

      if (!('EventSource' in window)) {
        startPolling();
        return;
      }

      setStatus((current) => (current === 'open' ? current : 'connecting'));

      try {
        const res = await api.post('/v1/events/ticket');
        if (closed) return;

        source = new EventSource(
          `${API_BASE}/v1/events/stream?ticket=${encodeURIComponent(res.data.ticket)}`
        );

        source.onopen = () => {
          failures = 0;
          clearPolling();
          setStatus('open');
          onPollRef.current?.();
        };

        source.addEventListener('notification.created', handleNotification);

        source.onerror = () => {
          source?.close();
          source = null;

          if (closed) return;

          failures += 1;

          if (failures >= MAX_FAILURES) {
            startPolling();
            return;
          }

          setStatus('reconnecting');
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (_error) {
        if (closed) return;

        failures += 1;

        if (failures >= MAX_FAILURES) {
          startPolling();
          return;
        }

        setStatus('reconnecting');
        reconnectTimer = setTimeout(connect, 3000);
      }
    };

    const handleOnline = () => {
      failures = 0;
      clearPolling();
      if (!source) connect();
    };

    connect();
    window.addEventListener('online', handleOnline);

    return () => {
      closed = true;
      source?.close();
      clearTimeout(reconnectTimer);
      clearPolling();
      window.removeEventListener('online', handleOnline);
      setStatus('idle');
    };
  }, [enabled]);

  return { status };
}
