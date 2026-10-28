import { RIOT_DISCLAIMER } from '../content/legal.js';

export default function RiotDisclaimer({ className = '' }) {
  return <p className={`text-[11px] leading-relaxed text-muted ${className}`}>{RIOT_DISCLAIMER}</p>;
}
