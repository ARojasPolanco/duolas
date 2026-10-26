import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  ClipboardList,
  Inbox,
  MessageSquare,
  Radio,
  RefreshCw,
  ShieldAlert,
  Swords,
  Trash2,
} from 'lucide-react';
import AppHeader from '../components/AppHeader.jsx';
import { useNotifications } from '../context/NotificationsContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import usePush from '../hooks/usePush.js';

const formatDateTime = (value) =>
  new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(new Date(value));

const iconByType = {
  match_created: Swords,
  invite_received: Inbox,
  invite_accepted: CheckCheck,
  invite_declined: Inbox,
  invite_cancelled: Inbox,
  application_received: ClipboardList,
  application_accepted: CheckCheck,
  application_rejected: ClipboardList,
  application_withdrawn: ClipboardList,
  post_suggested: ClipboardList,
  feedback_revealed: MessageSquare,
  warning_received: ShieldAlert,
  account_suspended: ShieldAlert,
};

const SSE_LABELS = {
  idle: 'Sin conexión',
  connecting: 'Conectando',
  open: 'En vivo',
  reconnecting: 'Reconectando',
  polling: 'Polling cada 20 s',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    notifications,
    unreadCount,
    loading,
    error,
    sseStatus,
    refresh,
    markRead,
    markAllRead,
    remove,
  } = useNotifications();
  const push = usePush();

  const openNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await markRead(notification.id);
      }
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos abrir la notificación.');
      return;
    }

    if (notification.data?.url) {
      navigate(notification.data.url);
    }
  };

  const deleteNotification = async (notification) => {
    try {
      await remove(notification.id);
      toast.success('Notificación eliminada.');
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos eliminar la notificación.');
    }
  };

  return (
    <div className="min-h-screen bg-bg px-5 py-8 text-text">
      <div className="mx-auto max-w-3xl space-y-6">
        <AppHeader />

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Notificaciones
            </p>
            <h1 className="mt-2 text-3xl font-extrabold">Tu actividad</h1>
            <p className="mt-2 text-sm text-muted">
              {unreadCount ? `${unreadCount} sin leer` : 'Todo al día'} ·{' '}
              {SSE_LABELS[sseStatus] || sseStatus}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refresh}
              className="rounded-lg border border-border p-2 text-muted"
              aria-label="Recargar notificaciones"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  await markAllRead();
                  toast.success('Todas marcadas como leídas.');
                } catch (requestError) {
                  toast.error(
                    requestError.response?.data?.message || 'No pudimos marcar las notificaciones.'
                  );
                }
              }}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted"
            >
              <CheckCheck size={14} aria-hidden="true" />
              Marcar todas
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-surface p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Bell className="text-accent" size={18} aria-hidden="true" />
              <div>
                <h2 className="text-sm font-bold">Notificaciones push</h2>
                <p className="text-[11px] text-muted">
                  {!push.supported
                    ? 'Este navegador no soporta push.'
                    : !push.available
                      ? 'Push no configurado en este entorno.'
                      : push.subscribed
                        ? 'Push activo en este dispositivo.'
                        : 'Activá push para recibir avisos con la app cerrada.'}
                </p>
              </div>
            </div>

            {push.available && push.supported ? (
              <button
                type="button"
                onClick={push.subscribed ? push.unsubscribe : push.subscribe}
                disabled={push.busy}
                className={`rounded-xl px-4 py-2.5 text-xs font-bold disabled:opacity-60 ${
                  push.subscribed ? 'border border-border text-muted' : 'bg-accent text-bg'
                }`}
              >
                {push.busy ? 'Procesando...' : push.subscribed ? 'Desactivar push' : 'Activar push'}
              </button>
            ) : null}
          </div>

          {push.ios && !push.standalone ? (
            <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 px-3 py-2.5 text-[11px] text-gold">
              En iOS, agregá Duo LAS a la pantalla de inicio y abrila como PWA para recibir push.
            </p>
          ) : null}

          {push.error ? (
            <p className="mt-3 rounded-xl border border-danger/40 bg-danger/10 px-3 py-2.5 text-[11px] text-danger">
              {push.error}
            </p>
          ) : null}

          {push.permission === 'denied' ? (
            <p className="mt-3 text-[11px] text-muted">
              El permiso está bloqueado en el navegador. Habilitalo desde la configuración del
              sitio.
            </p>
          ) : null}
        </section>

        {error ? (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : notifications.length ? (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = iconByType[notification.type] || Bell;

              return (
                <article
                  key={notification.id}
                  className={`rounded-2xl border bg-surface p-4 transition ${
                    notification.isRead ? 'border-border' : 'border-accent/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => openNotification(notification)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-accent">
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">{notification.title}</span>
                          {!notification.isRead ? (
                            <span
                              className="h-2 w-2 rounded-full bg-accent"
                              aria-label="No leída"
                            />
                          ) : null}
                        </span>
                        {notification.message ? (
                          <span className="mt-1 block text-sm text-muted">
                            {notification.message}
                          </span>
                        ) : null}
                        <span className="mt-2 block text-[10px] text-muted">
                          {formatDateTime(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNotification(notification)}
                      className="rounded-lg border border-border p-2 text-muted"
                      aria-label="Eliminar notificación"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <section className="rounded-2xl border border-border bg-surface p-8 text-center">
            <Radio className="mx-auto text-accent" size={30} aria-hidden="true" />
            <h2 className="mt-3 font-bold">No tenés notificaciones</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Cuando haya un match, una invitación o una postulación, la vas a ver acá.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
