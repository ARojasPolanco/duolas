import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Clock3, Gamepad2, Mic, MicOff, RefreshCw, Users, X } from 'lucide-react';
import AppShell from '../components/AppShell.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmailVerificationBanner from '../components/EmailVerificationBanner.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';
import { initialsOf } from '../utils/labels.js';

const WINDOWS = [
  { value: 'now', label: 'Ahora' },
  { value: 'tonight', label: 'Esta noche' },
];

const inputClass =
  'w-full rounded-xl border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-muted/70 focus:border-accent focus:outline-none';

const choiceClass = (selected) =>
  `rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
    selected
      ? 'border-accent bg-accent/15 text-accent'
      : 'border-border bg-bg text-muted hover:border-accent/50'
  }`;

const statusLabel = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  withdrawn: 'Retirada',
};

const postModeLabel = (post) =>
  post.mode === 'solo'
    ? 'Disponible para ARAM'
    : `Somos ${post.playersPresent}, buscamos ${post.slotsNeeded}`;

export default function AramPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('group');
  const [posts, setPosts] = useState([]);
  const [mine, setMine] = useState({ post: null, applications: [], myApplications: [] });
  const [form, setForm] = useState({
    playersPresent: 2,
    slotsNeeded: 1,
    window: 'now',
    hasMic: false,
    note: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [error, setError] = useState('');

  const canInteract = Boolean(user?.emailVerified && user?.profileCompleted);

  const load = useCallback(async () => {
    if (!localStorage.getItem('token') || !canInteract) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [listRes, mineRes] = await Promise.all([
        api.get('/v1/aram', { params: { mode: tab } }),
        api.get('/v1/aram/mine'),
      ]);
      setPosts(listRes.data.posts || []);
      setMine(mineRes.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos cargar las búsquedas ARAM.');
    } finally {
      setLoading(false);
    }
  }, [canInteract, tab]);

  useEffect(() => {
    load();
  }, [load]);

  const maxSlots = 5 - form.playersPresent;

  useEffect(() => {
    if (form.slotsNeeded > maxSlots) {
      setForm((current) => ({ ...current, slotsNeeded: maxSlots }));
    }
  }, [form.playersPresent, form.slotsNeeded, maxSlots]);

  const setField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const createPost = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await api.post('/v1/aram', {
        mode: tab,
        playersPresent: tab === 'solo' ? 1 : Number(form.playersPresent),
        slotsNeeded: tab === 'solo' ? 1 : Number(form.slotsNeeded),
        window: form.window,
        hasMic: form.hasMic,
        note: form.note.trim() || null,
      });
      toast.success(tab === 'solo' ? 'Ya estás disponible para ARAM.' : 'Publicación creada.');
      setForm((current) => ({ ...current, note: '' }));
      await load();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'No pudimos crear la publicación ARAM.');
    } finally {
      setSubmitting(false);
    }
  };

  const apply = async (post) => {
    setBusyId(post.id);
    try {
      await api.post(`/v1/aram/${post.id}/applications`, {});
      toast.success(post.mode === 'solo' ? 'Invitación enviada.' : 'Postulación enviada.');
      await load();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos enviar la solicitud.');
    } finally {
      setBusyId(null);
    }
  };

  const respond = async (applicationId, action) => {
    if (!mine.post) return;
    setBusyId(applicationId);
    try {
      await api.post(`/v1/aram/${mine.post.id}/applications/${applicationId}/${action}`);
      toast.success(
        action === 'accept' ? 'Jugador aceptado. Contacto en Matches.' : 'Postulación rechazada.'
      );
      await load();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos resolver la postulación.');
    } finally {
      setBusyId(null);
    }
  };

  const withdraw = async (application) => {
    setBusyId(application.id);
    try {
      await api.delete(`/v1/aram/${application.post.id}/applications/${application.id}`);
      toast.success('Postulación retirada.');
      await load();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos retirar la postulación.');
    } finally {
      setBusyId(null);
    }
  };

  const cancelPost = async () => {
    if (!mine.post) return;

    setBusyId(mine.post.id);
    try {
      await api.delete(`/v1/aram/${mine.post.id}`);
      toast.success('Publicación cerrada.');
      setCloseConfirmOpen(false);
      await load();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'No pudimos cerrar la publicación.');
    } finally {
      setBusyId(null);
    }
  };

  const setTabAndReset = (nextTab) => {
    setTab(nextTab);
    setError('');
  };

  if (!canInteract) {
    return (
      <AppShell>
        <section className="rounded-2xl border border-border bg-surface p-6">
          <h1 className="text-2xl font-extrabold">ARAM</h1>
          <p className="mt-2 text-sm text-muted">
            Necesitás el email verificado y el perfil completo para buscar ARAM.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {!user?.profileCompleted ? (
              <Link
                to="/onboarding"
                className="rounded-xl bg-accent px-5 py-3 text-center text-sm font-bold text-bg"
              >
                Completar perfil
              </Link>
            ) : null}
            {!user?.emailVerified ? (
              <span className="rounded-xl border border-border px-5 py-3 text-center text-sm text-muted">
                Revisá tu email para verificar la cuenta
              </span>
            ) : null}
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">ARAM</p>
            <h1 className="mt-2 text-3xl font-extrabold">Buscar para ARAM</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Sumate a un grupo, publicá tu lugar libre o ponete disponible para jugar ahora.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/como-funciona"
              className="inline-flex min-h-11 items-center rounded-lg border border-border px-3 text-xs font-semibold text-muted transition hover:border-accent/50 hover:text-text"
            >
              ¿Cómo funciona?
            </Link>
            <button
              type="button"
              onClick={load}
              className="rounded-lg border border-border p-2 text-muted"
              aria-label="Actualizar ARAM"
            >
              <RefreshCw size={16} aria-hidden="true" />
            </button>
          </div>
        </div>

        <EmailVerificationBanner />

        {error ? (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            ['group', 'Busco grupo'],
            ['solo', 'Disponible ahora'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTabAndReset(value)}
              className={`shrink-0 rounded-full border px-4 py-2.5 text-xs font-semibold transition ${
                tab === value
                  ? 'border-accent bg-accent/15 text-accent'
                  : 'border-border text-muted hover:border-accent/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : (
          <>
            {mine.post ? (
              <section className="rounded-2xl border border-accent/40 bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                      Tu publicación
                    </p>
                    <h2 className="mt-1 text-lg font-bold">{postModeLabel(mine.post)}</h2>
                    <p className="mt-1 text-xs text-muted">
                      {mine.post.windowLabel} · {mine.post.hasMic ? 'Con mic' : 'Sin mic'}
                      {mine.post.note ? ` · ${mine.post.note}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCloseConfirmOpen(true)}
                    disabled={busyId === mine.post.id}
                    className="rounded-lg border border-danger/40 px-3 py-2 text-xs font-semibold text-danger disabled:opacity-60"
                  >
                    Cerrar publicación
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  <p className="text-sm font-semibold">
                    Solicitudes recibidas ({mine.applications.length})
                  </p>
                  {mine.applications.length ? (
                    mine.applications.map((application) => (
                      <div
                        key={application.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-bg p-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-xs font-extrabold text-accent">
                            {initialsOf(application.applicant?.username)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">
                              @{application.applicant?.username}
                            </p>
                            <p className="text-[11px] text-muted">
                              {statusLabel[application.status] || application.status}
                              {application.message ? ` · ${application.message}` : ''}
                            </p>
                          </div>
                        </div>
                        {application.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => respond(application.id, 'accept')}
                              disabled={busyId === application.id}
                              className="inline-flex min-h-11 items-center gap-1 rounded-lg bg-accent px-3 text-xs font-bold text-bg disabled:opacity-60"
                            >
                              <Check size={14} aria-hidden="true" />
                              Aceptar
                            </button>
                            <button
                              type="button"
                              onClick={() => respond(application.id, 'reject')}
                              disabled={busyId === application.id}
                              className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-border px-3 text-xs font-semibold text-muted disabled:opacity-60"
                            >
                              <X size={14} aria-hidden="true" />
                              Rechazar
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-border bg-bg px-4 py-5 text-sm text-muted">
                      Todavía no hay solicitudes.
                    </p>
                  )}
                </div>
              </section>
            ) : (
              <section className="rounded-2xl border border-border bg-surface p-5">
                <h2 className="text-lg font-bold">
                  {tab === 'solo' ? 'Ponerme disponible' : 'Publicar mi grupo'}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {tab === 'solo'
                    ? 'Avisá que estás para ARAM y los grupos pueden invitarte.'
                    : 'Completá los lugares que les faltan para el ARAM.'}
                </p>

                <form onSubmit={createPost} className="mt-5 space-y-4">
                  {tab === 'group' ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block text-sm font-semibold">
                        Ya somos
                        <select
                          className="mt-2 w-full rounded-xl border border-border bg-bg px-3 py-3 text-sm text-text"
                          value={form.playersPresent}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              playersPresent: Number(event.target.value),
                            }))
                          }
                        >
                          {[2, 3, 4].map((value) => (
                            <option key={value} value={value}>
                              {value} jugadores
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block text-sm font-semibold">
                        Buscamos
                        <select
                          className="mt-2 w-full rounded-xl border border-border bg-bg px-3 py-3 text-sm text-text"
                          value={form.slotsNeeded}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              slotsNeeded: Number(event.target.value),
                            }))
                          }
                        >
                          {Array.from({ length: maxSlots }, (_, index) => index + 1).map(
                            (value) => (
                              <option key={value} value={value}>
                                {value} jugador{value === 1 ? '' : 'es'}
                              </option>
                            )
                          )}
                        </select>
                      </label>
                    </div>
                  ) : null}

                  <div>
                    <p className="mb-2 text-sm font-semibold">¿Cuándo?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {WINDOWS.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, window: item.value }))}
                          className={choiceClass(form.window === item.value)}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold">Micrófono</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, hasMic: true }))}
                        className={choiceClass(form.hasMic)}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <Mic size={14} aria-hidden="true" /> Tengo mic
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, hasMic: false }))}
                        className={choiceClass(!form.hasMic)}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          <MicOff size={14} aria-hidden="true" /> Sin mic
                        </span>
                      </button>
                    </div>
                  </div>

                  <label className="block text-sm font-semibold">
                    Nota (opcional)
                    <textarea
                      className={`${inputClass} mt-2 min-h-[80px] resize-y`}
                      value={form.note}
                      onChange={setField('note')}
                      maxLength={140}
                      placeholder="Ej.: buscamos support, jugamos relaxed."
                    />
                    <span className="mt-1 block text-right text-xs text-muted">
                      {form.note.length}/140
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-accent px-5 py-3 text-sm font-bold text-bg disabled:opacity-60 sm:w-auto"
                  >
                    {submitting
                      ? 'Publicando...'
                      : tab === 'solo'
                        ? 'Ponerme disponible'
                        : 'Publicar grupo'}
                  </button>
                </form>
              </section>
            )}

            <section>
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                    {tab === 'solo' ? 'Disponibles ahora' : 'Grupos que buscan'}
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold">
                    {tab === 'solo' ? 'Gente para ARAM' : 'Sumate a un grupo'}
                  </h2>
                </div>
              </div>

              {posts.length ? (
                <div className="space-y-3">
                  {posts.map((post) => {
                    const alreadyApplied = ['pending', 'accepted'].includes(
                      post.myApplicationStatus
                    );
                    return (
                      <article
                        key={post.id}
                        className="rounded-2xl border border-border bg-surface p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-sm font-extrabold text-accent">
                              {initialsOf(post.owner?.username)}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-bold">@{post.owner?.username}</p>
                              <p className="mt-1 text-sm text-muted">{postModeLabel(post)}</p>
                              <p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                                <Clock3 size={12} aria-hidden="true" />
                                {post.windowLabel}
                                <span>·</span>
                                {post.hasMic ? 'Con mic' : 'Sin mic'}
                              </p>
                            </div>
                          </div>
                          {alreadyApplied ? (
                            <span className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-[10px] font-bold text-accent">
                              {post.myApplicationStatus === 'accepted'
                                ? 'Aceptado'
                                : 'Solicitud enviada'}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => apply(post)}
                              disabled={busyId === post.id}
                              className="inline-flex min-h-11 items-center gap-1 rounded-xl bg-accent px-4 text-xs font-bold text-bg disabled:opacity-60"
                            >
                              <Users size={14} aria-hidden="true" />
                              {post.mode === 'solo' ? 'Invitar' : 'Sumarme'}
                            </button>
                          )}
                        </div>
                        {post.note ? (
                          <p className="mt-3 rounded-xl border border-border bg-bg px-4 py-3 text-sm text-muted">
                            {post.note}
                          </p>
                        ) : null}
                        {post.myApplicationStatus === 'accepted' ? (
                          <Link
                            to="/matches"
                            className="mt-3 inline-flex min-h-11 items-center text-xs font-semibold text-accent hover:underline"
                          >
                            Ver contacto en Matches
                          </Link>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-surface p-8 text-center">
                  <Gamepad2 className="mx-auto text-gold" size={30} aria-hidden="true" />
                  <h3 className="mt-3 font-bold">Todavía no hay publicaciones</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted">
                    Podés ser la primera persona en buscar ARAM.
                  </p>
                </div>
              )}
            </section>

            <section>
              <h2 className="text-lg font-bold">Mis solicitudes enviadas</h2>
              {mine.myApplications.length ? (
                <div className="mt-3 space-y-2">
                  {mine.myApplications.map((application) => (
                    <div
                      key={application.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
                    >
                      <div>
                        <p className="text-sm font-semibold">
                          @{application.post.owner?.username} · {postModeLabel(application.post)}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {statusLabel[application.status] || application.status} ·{' '}
                          {application.post.windowLabel}
                        </p>
                      </div>
                      {application.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => withdraw(application)}
                          disabled={busyId === application.id}
                          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted disabled:opacity-60"
                        >
                          Retirar
                        </button>
                      ) : application.status === 'accepted' ? (
                        <Link
                          to="/matches"
                          className="text-xs font-semibold text-accent hover:underline"
                        >
                          Ver contacto
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-xl border border-border bg-surface px-4 py-5 text-sm text-muted">
                  Todavía no enviaste solicitudes ARAM.
                </p>
              )}
            </section>
          </>
        )}
      </div>

      {closeConfirmOpen && mine.post ? (
        <ConfirmDialog
          title="Cerrar publicación ARAM"
          description="La publicación dejará de estar visible y no recibirá más postulaciones."
          confirmLabel="Cerrar publicación"
          cancelLabel="Volver"
          busy={busyId === mine.post.id}
          onConfirm={cancelPost}
          onClose={() => setCloseConfirmOpen(false)}
        />
      ) : null}
    </AppShell>
  );
}
