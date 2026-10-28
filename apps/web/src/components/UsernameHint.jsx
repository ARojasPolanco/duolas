export default function UsernameHint({ className = '' }) {
  return (
    <p className={`text-[10px] leading-tight text-muted ${className}`}>
      Usuario de Duo LAS, no Riot ID
    </p>
  );
}
