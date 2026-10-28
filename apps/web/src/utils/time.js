import { COUNTRY_TIMEZONES, TIMEZONE } from '@duo-las/shared/constants';

const BLOCK_RANGES = {
  early: [0, 6],
  morning: [6, 12],
  afternoon: [12, 18],
  night: [18, 24],
};

const pad = (value) => String(value).padStart(2, '0');

const clock = (minutes, isEnd = false) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  if (isEnd && normalized === 0) return '24:00';
  return `${pad(Math.floor(normalized / 60))}:${pad(normalized % 60)}`;
};

export const getTimeZoneOffsetMinutes = (timeZone, date = new Date()) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value])
  );

  const asUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return Math.round((asUtc - date.getTime()) / 60000);
};

export const getCountryOffsetMinutes = (country, date = new Date()) => {
  const timeZone = COUNTRY_TIMEZONES[country];
  if (!timeZone) return 0;

  return getTimeZoneOffsetMinutes(timeZone, date) - getTimeZoneOffsetMinutes(TIMEZONE, date);
};

export const formatCountryOffset = (country, date = new Date()) => {
  const difference = getCountryOffsetMinutes(country, date);
  if (!difference) return 'misma hora que ART';

  const hours = Math.abs(difference) / 60;
  return `${difference > 0 ? '+' : '-'}${hours} h vs. ART`;
};

export const formatBlockRange = (block, country, date = new Date()) => {
  const range = BLOCK_RANGES[block];
  if (!range) return '';

  const difference = getCountryOffsetMinutes(country, date);
  return `${clock(range[0] * 60 + difference)}–${clock(range[1] * 60 + difference, true)}`;
};
