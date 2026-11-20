import { useEffect, useState } from 'react';
import { Swords, Users, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CLASH_EVENT_ENDS_AT } from '@duo-las/shared/constants';
import { useAuth } from '../context/AuthContext.jsx';

const STORAGE_KEY = 'clash-announcement-2026-11';
const eventActive = new Date(CLASH_EVENT_ENDS_AT) > new Date();

export default function ClashAnnouncementModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(() => {
    try {
      return eventActive && sessionStorage.getItem(STORAGE_KEY) !== '1';
    } catch (_error) {
      return eventActive;
    }
  });

  useEffect(() => {
    if (location.pathname === '/clash') setOpen(false);
  }, [location.pathname]);

  const close = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch (_error) {
      // La modal se cierra igual en el estado de React.
    }
    setOpen(false);
  };

  const goToClash = () => {
    close();
    navigate('/clash');
  };

  if (!open || user?.role === 'admin') return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="clash-announcement-title"
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/75 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-gold/40 bg-surface p-6 shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/15 blur-3xl" />
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 rounded-lg border border-border p-1.5 text-muted"
          aria-label="Cerrar"
        >
          <X size={16} aria-hidden="true" />
        </button>

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
            <Swords size={12} aria-hidden="true" />
            Worlds Clash · 21 y 22 de noviembre
          </span>
          <h2 id="clash-announcement-title" className="mt-4 text-3xl font-extrabold">
            ¿Jugás Clash este finde?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            En Duo LAS podés crear tu equipo, buscar los roles que te faltan y postularte a otros
            equipos. Todo queda separado del match normal.
          </p>
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-bg p-3 text-xs text-muted">
            <Users size={15} className="mt-0.5 shrink-0 text-gold" aria-hidden="true" />
            <p>
              El capitán arma el equipo y manda las invitaciones desde el cliente de League of
              Legends. Acá solo coordinamos jugadores y contactos.
            </p>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={goToClash}
              className="min-h-11 flex-1 rounded-xl bg-gold px-4 text-sm font-bold text-bg"
            >
              Ver equipos Clash
            </button>
            <button
              type="button"
              onClick={close}
              className="min-h-11 rounded-xl border border-border px-4 text-sm font-semibold text-muted"
            >
              Ahora no
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
