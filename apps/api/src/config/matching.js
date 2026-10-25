export const RANK_TOLERANCE = {
  solo_duo: 4,
  flex: 8,
};

export const DUO_WEIGHTS = {
  schedule: 40,
  style: 25,
  language: 15,
  roles: 10,
  mic: 5,
  rank: 5,
};

export const NOW_WEIGHTS = {
  rank: 30,
  style: 25,
  language: 20,
  mic: 10,
  reputation: 15,
};

export const POST_WEIGHTS = {
  rank: 40,
  roles: 30,
  style: 20,
  language: 10,
};

export const STYLE_MATRIX = {
  casual: { casual: 1, ranked: 0.6, tryhard: 0.2 },
  ranked: { casual: 0.6, ranked: 1, tryhard: 0.6 },
  tryhard: { casual: 0.2, ranked: 0.6, tryhard: 1 },
};

export const REQUIRE_SCHEDULE_OVERLAP = true;
export const CANDIDATE_FETCH_LIMIT = 200;
export const CANDIDATE_RETURN_LIMIT = 20;
