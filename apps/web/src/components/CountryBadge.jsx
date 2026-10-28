import { Globe2 } from 'lucide-react';
import { COUNTRY_LABELS } from '../utils/labels.js';
import { formatCountryOffset } from '../utils/time.js';

export default function CountryBadge({ country, className = '' }) {
  if (!country) return null;

  const label = COUNTRY_LABELS[country] || country;
  const offset = formatCountryOffset(country);

  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1 ${className}`}
      title={`Los horarios se guardan en ART. ${label}: ${offset}.`}
    >
      <Globe2 size={12} className="shrink-0" aria-hidden="true" />
      <span className="truncate">
        {label} · {offset}
      </span>
    </span>
  );
}
