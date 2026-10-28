export const USER_ROLES = Object.freeze(['player', 'admin']);
export const USER_STATUSES = Object.freeze(['active', 'suspended']);

export const ROLES = Object.freeze(['top', 'jungle', 'mid', 'adc', 'support']);

export const RANK_TIERS = Object.freeze([
  'iron',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'emerald',
  'diamond',
  'master',
  'grandmaster',
  'challenger',
]);

export const RANK_DIVISIONS = Object.freeze(['iv', 'iii', 'ii', 'i']);

export const RANK_TIER_INDEX = Object.freeze(
  RANK_TIERS.reduce((acc, tier, index) => {
    acc[tier] = index;
    return acc;
  }, {})
);

export const RANK_DIVISION_INDEX = Object.freeze(
  RANK_DIVISIONS.reduce((acc, division, index) => {
    acc[division] = index;
    return acc;
  }, {})
);

export const RANK_SOURCES = Object.freeze(['declared', 'riot']);
export const QUEUES = Object.freeze(['solo_duo', 'flex']);
export const PLAY_STYLES = Object.freeze(['casual', 'ranked', 'tryhard']);
export const LANGUAGES = Object.freeze(['es', 'en', 'pt']);

export const COUNTRIES = Object.freeze(['AR', 'CL', 'BO', 'PY', 'UY']);

export const COUNTRY_TIMEZONES = Object.freeze({
  AR: 'America/Argentina/Buenos_Aires',
  CL: 'America/Santiago',
  BO: 'America/La_Paz',
  PY: 'America/Asuncion',
  UY: 'America/Montevideo',
});

export const SCHEDULE_DAYS = Object.freeze(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
export const SCHEDULE_BLOCKS = Object.freeze(['early', 'morning', 'afternoon', 'night']);
export const SCHEDULE_BLOCK_VALUES = Object.freeze(
  SCHEDULE_DAYS.flatMap((day) => SCHEDULE_BLOCKS.map((block) => `${day}_${block}`))
);

export const AVAILABILITY_STATUSES = Object.freeze(['active', 'closed']);
export const AVAILABILITY_CLOSED_REASONS = Object.freeze(['expired', 'manual', 'matched']);

export const LIKE_STATUSES = Object.freeze(['pending', 'matched', 'cancelled']);
export const CONNECTION_SOURCES = Object.freeze(['like', 'availability', 'post']);
export const CONNECTION_STATUSES = Object.freeze(['active', 'archived']);

export const POST_STATUSES = Object.freeze(['active', 'filled', 'expired', 'cancelled']);
export const APPLICATION_STATUSES = Object.freeze(['pending', 'accepted', 'rejected', 'withdrawn']);
export const INVITE_STATUSES = Object.freeze([
  'pending',
  'accepted',
  'declined',
  'cancelled',
  'expired',
]);

export const REPORT_REASONS = Object.freeze([
  'toxicity',
  'fake_rank',
  'abandonment',
  'spam',
  'underage',
  'other',
]);
export const REPORT_STATUSES = Object.freeze(['open', 'reviewing', 'resolved', 'dismissed']);

export const SENTIMENTS = Object.freeze(['positive', 'negative']);
export const FEEDBACK_TAGS = Object.freeze([
  'good_vibes',
  'communicative',
  'tryhard',
  'punctual',
  'good_game',
  'toxicity',
  'abandonment',
  'fake_rank',
  'no_communication',
  'other',
]);

export const NOTIFICATION_TYPES = Object.freeze([
  'match_created',
  'invite_received',
  'invite_accepted',
  'invite_declined',
  'invite_cancelled',
  'application_received',
  'application_accepted',
  'application_rejected',
  'application_withdrawn',
  'post_suggested',
  'feedback_revealed',
  'warning_received',
  'account_suspended',
]);

export const METRIC_EVENT_TYPES = Object.freeze([
  'user_registered',
  'email_verified',
  'profile_completed',
  'availability_opened',
  'availability_closed',
  'like_sent',
  'match_created',
  'contact_revealed',
  'invite_sent',
  'invite_accepted',
  'post_created',
  'application_sent',
  'application_accepted',
  'feedback_submitted',
  'feedback_revealed',
  'report_created',
  'user_suspended',
  'push_subscribed',
]);

export const RANK_TOLERANCE = Object.freeze({
  solo_duo: 4,
  flex: 8,
});

export const TIMEZONE = 'America/Argentina/Buenos_Aires';
