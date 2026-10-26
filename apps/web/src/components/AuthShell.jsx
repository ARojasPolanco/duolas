import { Link } from 'react-router-dom';

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-5 py-10 text-text">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mx-auto mb-8 flex min-h-11 w-fit items-center text-2xl font-extrabold tracking-tight"
        >
          Duo<span className="text-accent">LAS</span>
        </Link>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xl shadow-black/20 sm:p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? <div className="mt-6 text-center text-sm text-muted">{footer}</div> : null}
      </div>
    </div>
  );
}
