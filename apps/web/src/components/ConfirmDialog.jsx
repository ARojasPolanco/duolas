import { useEffect, useId, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmDialog({
  open = true,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'danger',
  busy = false,
  onConfirm,
  onClose,
}) {
  const titleId = useId();
  const cancelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);

  useEffect(() => {
    onCloseRef.current = onClose;
    busyRef.current = busy;
  }, [onClose, busy]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    cancelRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busyRef.current) onCloseRef.current();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (!open) return null;

  const confirmClass =
    tone === 'danger'
      ? 'bg-danger text-bg hover:bg-danger/90'
      : 'bg-accent text-bg hover:bg-accent-strong';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/75 p-4 sm:items-center"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-danger" size={20} aria-hidden="true" />
            <h2 id={titleId} className="font-bold">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-border p-1.5 text-muted disabled:opacity-60"
            aria-label="Cerrar"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {description ? (
          <p className="mt-4 text-sm leading-relaxed text-muted">{description}</p>
        ) : null}

        <div className="mt-5 flex gap-2">
          <button
            ref={cancelRef}
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-muted disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-60 ${confirmClass}`}
          >
            {busy ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
