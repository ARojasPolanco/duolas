import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function PasswordField({
  label,
  value,
  onChange,
  autoComplete = 'current-password',
  minLength,
  maxLength,
  placeholder,
  required = true,
  action,
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div className="block text-sm font-semibold">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id}>{label}</label>
        {action}
      </div>
      <div className="relative mt-2">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="w-full rounded-xl border border-border bg-bg px-4 py-3 pr-12 text-sm text-text placeholder:text-muted/70 focus:border-accent focus:outline-none"
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          minLength={minLength}
          maxLength={maxLength}
          placeholder={placeholder}
          required={required}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition hover:text-text"
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
