import { useState } from 'react';
import { MailWarning } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../config/api.js';

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sending, setSending] = useState(false);

  if (!user || user.emailVerified) return null;

  const resend = async () => {
    setSending(true);
    try {
      await api.post('/v1/auth/resend-verification');
      toast.success('Te reenviamos el email de verificación.');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'No pudimos reenviar el email. Intentá de nuevo.'
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gold/40 bg-gold/10 p-4 text-sm text-gold sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <MailWarning size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          Verificá tu email para poder matchear, invitar y publicar. Revisá también spam o
          promociones.
        </p>
      </div>
      <button
        type="button"
        onClick={resend}
        disabled={sending}
        className="shrink-0 rounded-lg border border-gold/50 px-4 py-2 text-xs font-bold text-gold disabled:opacity-60"
      >
        {sending ? 'Enviando...' : 'Reenviar email'}
      </button>
    </div>
  );
}
