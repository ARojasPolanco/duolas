const now = Date.now();
const hoursAgo = (hours) => now - hours * 60 * 60 * 1000;

export const DEMO_DUO_PROFILE = {
  roles: 'Mid / ADC',
  style: 'Ranked en serio',
  languages: 'Español',
  mic: 'Con mic',
  bio: 'Juego ranked después de las 21. Busco duo para subir sin tilt y con comunicación.',
  schedule: ['Lun · Noche', 'Mié · Noche', 'Vie · Noche'],
  availability: 'Disponible ahora',
};

export const RIOT_DEMO_DEFAULT_ID = 'LunarFox#LAS';

export const RIOT_DEMO_CHAMPIONS = {
  64: { name: 'Lee Sin', image: 'LeeSin.png' },
  84: { name: 'Akali', image: 'Akali.png' },
  103: { name: 'Ahri', image: 'Ahri.png' },
  142: { name: 'Zoe', image: 'Zoe.png' },
  157: { name: 'Yasuo', image: 'Yasuo.png' },
  202: { name: 'Jhin', image: 'Jhin.png' },
  222: { name: 'Jinx', image: 'Jinx.png' },
  238: { name: 'Zed', image: 'Zed.png' },
  412: { name: 'Thresh', image: 'Thresh.png' },
};

export const RIOT_DEMO_PROFILES = [
  {
    account: { puuid: 'demo-lunarfox', gameName: 'LunarFox', tagLine: 'LAS' },
    summoner: {
      puuid: 'demo-lunarfox',
      profileIconId: 4568,
      summonerLevel: 287,
      revisionDate: hoursAgo(2),
    },
    league: [
      {
        queueType: 'RANKED_SOLO_5x5',
        tier: 'DIAMOND',
        rank: 'II',
        leaguePoints: 42,
        wins: 134,
        losses: 112,
        hotStreak: true,
        veteran: true,
        freshBlood: false,
        inactive: false,
      },
      {
        queueType: 'RANKED_FLEX_SR',
        tier: 'PLATINUM',
        rank: 'I',
        leaguePoints: 80,
        wins: 41,
        losses: 37,
        hotStreak: false,
        veteran: false,
        freshBlood: false,
        inactive: false,
      },
    ],
    masteries: [
      {
        championId: 103,
        championLevel: 12,
        championPoints: 842000,
        lastPlayTime: hoursAgo(3),
      },
      {
        championId: 84,
        championLevel: 10,
        championPoints: 615000,
        lastPlayTime: hoursAgo(5),
      },
      {
        championId: 142,
        championLevel: 9,
        championPoints: 488000,
        lastPlayTime: hoursAgo(8),
      },
    ],
    duo: {
      roles: 'Mid / ADC',
      style: 'Ranked en serio',
      languages: 'Español',
      mic: 'Con mic',
      bio: 'Juego ranked después de las 21. Busco duo para subir sin tilt y con comunicación.',
      schedule: ['Lun · Noche', 'Mié · Noche', 'Vie · Noche'],
      availability: 'Disponible ahora',
    },
    match: {
      score: 88,
      reasons: ['Mismo horario nocturno', 'Rango cercano', 'Mid + Jungla'],
    },
    available: {
      since: 'Hace 3 min',
      queue: 'Solo/Dúo',
      note: 'Busca jungla para ranked',
    },
    post: {
      title: 'Mid + Jungla para subir a Diamante',
      needed: '1 lugar',
      description: 'Buscamos jungla con buen sentido de objetivos. Horario nocturno y con mic.',
    },
  },
  {
    account: { puuid: 'demo-ironwolf', gameName: 'IronWolf', tagLine: 'LAS' },
    summoner: {
      puuid: 'demo-ironwolf',
      profileIconId: 5241,
      summonerLevel: 164,
      revisionDate: hoursAgo(6),
    },
    league: [
      {
        queueType: 'RANKED_SOLO_5x5',
        tier: 'EMERALD',
        rank: 'IV',
        leaguePoints: 18,
        wins: 88,
        losses: 79,
        hotStreak: false,
        veteran: false,
        freshBlood: true,
        inactive: false,
      },
    ],
    masteries: [
      {
        championId: 64,
        championLevel: 11,
        championPoints: 731000,
        lastPlayTime: hoursAgo(4),
      },
      {
        championId: 157,
        championLevel: 9,
        championPoints: 512000,
        lastPlayTime: hoursAgo(10),
      },
      {
        championId: 238,
        championLevel: 8,
        championPoints: 398000,
        lastPlayTime: hoursAgo(16),
      },
    ],
    duo: {
      roles: 'Jungla / Top',
      style: 'Tryhard',
      languages: 'Español · Inglés',
      mic: 'Sin mic',
      bio: 'Jungla agresivo, juego para objetivos. Busco duo que siga llamadas y no tiltee.',
      schedule: ['Mar · Tarde', 'Jue · Noche', 'Sáb · Tarde'],
      availability: 'Disponible en 1 h',
    },
    match: {
      score: 92,
      reasons: ['Horarios compatibles', 'Rango cercano', 'Jungla + Mid'],
    },
    available: {
      since: 'Hace 5 min',
      queue: 'Solo/Dúo',
      note: 'Jungla para ranked',
    },
    post: {
      title: 'Jungla + Mid para ranked serio',
      needed: '1 lugar',
      description: 'Busco mid con comunicación para jugar objetivos y subir sin tilt.',
    },
  },
  {
    account: { puuid: 'demo-luna', gameName: 'Luna', tagLine: 'LAS' },
    summoner: {
      puuid: 'demo-luna',
      profileIconId: 588,
      summonerLevel: 421,
      revisionDate: hoursAgo(1),
    },
    league: [
      {
        queueType: 'RANKED_SOLO_5x5',
        tier: 'MASTER',
        rank: null,
        leaguePoints: 312,
        wins: 210,
        losses: 176,
        hotStreak: false,
        veteran: true,
        freshBlood: false,
        inactive: false,
      },
      {
        queueType: 'RANKED_FLEX_SR',
        tier: 'DIAMOND',
        rank: 'III',
        leaguePoints: 64,
        wins: 56,
        losses: 44,
        hotStreak: true,
        veteran: false,
        freshBlood: false,
        inactive: false,
      },
    ],
    masteries: [
      {
        championId: 222,
        championLevel: 13,
        championPoints: 1104000,
        lastPlayTime: hoursAgo(2),
      },
      {
        championId: 202,
        championLevel: 11,
        championPoints: 760000,
        lastPlayTime: hoursAgo(7),
      },
      {
        championId: 412,
        championLevel: 10,
        championPoints: 655000,
        lastPlayTime: hoursAgo(11),
      },
    ],
    duo: {
      roles: 'ADC / Support',
      style: 'Ranked en serio',
      languages: 'Español',
      mic: 'Con mic',
      bio: 'Main ADC, también juego support. Busco duo con buen sentido de objetivo y ganas de subir.',
      schedule: ['Lun · Noche', 'Mar · Noche', 'Dom · Noche'],
      availability: 'Disponible ahora',
    },
    match: {
      score: 85,
      reasons: ['Mismo rol compatible', 'Rango cercano', 'Con mic'],
    },
    available: {
      since: 'Hace 12 min',
      queue: 'Flex',
      note: 'ADC para Flex',
    },
    post: {
      title: 'ADC + Support para Flex',
      needed: '2 lugares',
      description: 'Grupo tranquilo para Flex. Buscamos support y jungla con horario nocturno.',
    },
  },
];

export const resolveRiotDemoProfile = (riotId) => {
  const normalized = (riotId || '').trim();
  const [gameName, tagLine] = normalized.split('#');
  const match = RIOT_DEMO_PROFILES.find(
    (profile) =>
      profile.account.gameName.toLowerCase() === gameName?.toLowerCase() &&
      profile.account.tagLine.toLowerCase() === tagLine?.toLowerCase()
  );
  const base = match || RIOT_DEMO_PROFILES[0];

  return {
    ...base,
    account: match
      ? base.account
      : {
          ...base.account,
          puuid: `demo-${gameName?.toLowerCase() || 'invitado'}`,
          gameName: gameName || base.account.gameName,
          tagLine: tagLine || base.account.tagLine,
        },
    fetchedAt: new Date().toISOString(),
    cached: false,
  };
};
