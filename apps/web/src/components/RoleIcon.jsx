const ICONS = {
  top: (
    <>
      <path d="M5 19 19 5" />
      <path d="M13 5h6v6" />
      <path d="m4 14 6 6" />
    </>
  ),
  jungle: (
    <>
      <path d="M20 4C12 4 5 8 5 14c0 3 2 6 6 6 6 0 9-7 9-16Z" />
      <path d="M5 19c3-5 6-8 11-11" />
    </>
  ),
  mid: (
    <>
      <path d="M12 3 21 12 12 21 3 12Z" />
      <path d="M7 12h10M12 7v10" />
    </>
  ),
  adc: (
    <>
      <path d="M5 5c8 0 14 6 14 14" />
      <path d="M5 5l14 14" />
      <path d="M14 5h5v5" />
    </>
  ),
  support: (
    <>
      <path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 4.6-7 9-7 9Z" />
      <path d="M9 11h6M12 8v6" />
    </>
  ),
  fill: (
    <>
      <path d="M12 3v18M3 12h18" />
      <path d="m5.6 5.6 12.8 12.8M18.4 5.6 5.6 18.4" />
    </>
  ),
};

export default function RoleIcon({ role, size = 20, className = '' }) {
  const icon = ICONS[role];
  if (!icon) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      {icon}
    </svg>
  );
}
