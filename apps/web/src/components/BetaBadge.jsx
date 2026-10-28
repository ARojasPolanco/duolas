export default function BetaBadge({ className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.16em] text-accent ${className}`}
      title="Duo LAS está en fase beta: pueden haber cambios y errores."
    >
      <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
      Beta
    </span>
  );
}
