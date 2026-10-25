import { Op } from 'sequelize';
import { envs } from '../src/config/enviroments.js';
import sequelize from '../src/config/database/database.js';
import { runMigrations } from '../src/config/database/migrator.js';
import User from '../src/modules/auth/auth.model.js';
import PlayerProfile from '../src/modules/profiles/profile.model.js';
import { computeRankIndex } from '../src/modules/profiles/profile.service.js';
import DuoConnection from '../src/modules/matching/duoConnection.model.js';
import DuoLike from '../src/modules/matching/duoLike.model.js';
import Notification from '../src/modules/notifications/notification.model.js';
import Block from '../src/modules/trust/block.model.js';
import { orderedPair } from '../src/modules/matching/matching.utils.js';

const DEMO_PASSWORD = 'Demo12345!';

const demoPlayers = [
  {
    key: 'mid',
    username: 'demo_mid',
    email: 'demo_mid@duolas.app',
    riotId: 'DemoMid#LAS',
    primaryRole: 'mid',
    secondaryRole: 'jungle',
    rankTier: 'diamond',
    rankDivision: 'ii',
    rankLp: 42,
    playStyle: 'ranked',
    languages: ['es', 'en'],
    hasMic: true,
    scheduleBlocks: ['sun_early', 'sun_night'],
    bio: 'Mid main. Busco duo para ranked con horarios de noche.',
    discordTag: 'demomid',
    reputationPositive: 12,
    reputationNegative: 1,
    reputationScore: 82,
  },
  {
    key: 'jungle',
    username: 'demo_jungle',
    email: 'demo_jungle@duolas.app',
    riotId: 'DemoJungle#LAS',
    primaryRole: 'jungle',
    secondaryRole: 'top',
    rankTier: 'diamond',
    rankDivision: 'iii',
    rankLp: 80,
    playStyle: 'ranked',
    languages: ['es', 'en'],
    hasMic: true,
    scheduleBlocks: ['sun_early', 'sun_night'],
    bio: 'Jungla main, prefiero comunicar por voz.',
    discordTag: 'demojungle',
    reputationPositive: 8,
    reputationNegative: 2,
    reputationScore: 71,
  },
  {
    key: 'adc',
    username: 'demo_adc',
    email: 'demo_adc@duolas.app',
    riotId: 'DemoAdc#LAS',
    primaryRole: 'adc',
    secondaryRole: 'support',
    rankTier: 'diamond',
    rankDivision: 'iii',
    rankLp: 15,
    playStyle: 'ranked',
    languages: ['es'],
    hasMic: true,
    scheduleBlocks: ['sun_early', 'sun_night'],
    bio: 'ADC main. Busco support o jungla para duo.',
    discordTag: 'demoadc',
    reputationPositive: 6,
    reputationNegative: 0,
    reputationScore: 80,
  },
  {
    key: 'support',
    username: 'demo_support',
    email: 'demo_support@duolas.app',
    riotId: 'DemoSupport#LAS',
    primaryRole: 'support',
    secondaryRole: 'top',
    rankTier: 'diamond',
    rankDivision: 'iv',
    rankLp: 20,
    playStyle: 'casual',
    languages: ['es', 'en'],
    hasMic: true,
    scheduleBlocks: ['sun_early', 'sun_night'],
    bio: 'Support main, juego para mejorar sin toxicidad.',
    discordTag: 'demosupport',
    reputationPositive: 4,
    reputationNegative: 1,
    reputationScore: 67,
  },
];

const createOrUpdateDemoUser = async (player) => {
  const profileData = {
    riotId: player.riotId,
    riotIdNormalized: player.riotId.toLowerCase(),
    server: 'LAS',
    primaryRole: player.primaryRole,
    secondaryRole: player.secondaryRole,
    rankTier: player.rankTier,
    rankDivision: player.rankDivision,
    rankLp: player.rankLp,
    rankIndex: computeRankIndex(player.rankTier, player.rankDivision),
    playStyle: player.playStyle,
    languages: player.languages,
    hasMic: player.hasMic,
    scheduleBlocks: player.scheduleBlocks,
    bio: player.bio,
    discordTag: player.discordTag,
    rankSource: 'declared',
    profileCompletedAt: new Date(),
    reputationPositive: player.reputationPositive,
    reputationNegative: player.reputationNegative,
    reputationScore: player.reputationScore,
    reputationCalculatedAt: new Date(),
    isDeleted: false,
  };

  const [user, userCreated] = await User.findOrCreate({
    where: { email: player.email },
    defaults: {
      username: player.username,
      password: DEMO_PASSWORD,
      emailVerified: true,
      ageConfirmedAt: new Date(),
      termsAcceptedAt: new Date(),
      lastActiveAt: new Date(),
    },
  });

  if (!userCreated) {
    await user.update({
      password: DEMO_PASSWORD,
      emailVerified: true,
      isDeleted: false,
      status: 'active',
      suspendedUntil: null,
      suspensionReason: null,
      lastActiveAt: new Date(),
    });
  }

  const [profile, profileCreated] = await PlayerProfile.findOrCreate({
    where: { userId: user.id },
    defaults: { userId: user.id, ...profileData },
  });

  if (!profileCreated) {
    await profile.update(profileData);
  }

  return user;
};

const main = async () => {
  if (envs.NODE_ENV === 'production') {
    throw new Error('El seed de demo no se puede ejecutar en producción.');
  }

  try {
    await sequelize.authenticate();
    await runMigrations();

    const users = {};

    for (const player of demoPlayers) {
      users[player.key] = await createOrUpdateDemoUser(player);
    }

    const demoIds = Object.values(users).map((user) => user.id);

    await DuoLike.destroy({
      where: {
        fromUserId: { [Op.in]: demoIds },
        toUserId: { [Op.in]: demoIds },
      },
    });
    await DuoConnection.destroy({
      where: {
        userLowId: { [Op.in]: demoIds },
        userHighId: { [Op.in]: demoIds },
      },
    });
    await Notification.destroy({ where: { userId: { [Op.in]: demoIds } } });
    await Block.destroy({
      where: {
        blockerId: { [Op.in]: demoIds },
        blockedId: { [Op.in]: demoIds },
      },
    });

    const [lowId, highId] = orderedPair(users.mid.id, users.jungle.id);

    const connection = await DuoConnection.create({
      userLowId: lowId,
      userHighId: highId,
      source: 'like',
      status: 'active',
      contactRevealedAt: new Date(),
    });

    await DuoLike.bulkCreate([
      { fromUserId: users.mid.id, toUserId: users.jungle.id, status: 'matched' },
      { fromUserId: users.jungle.id, toUserId: users.mid.id, status: 'matched' },
      { fromUserId: users.adc.id, toUserId: users.mid.id, status: 'pending' },
    ]);

    const notificationData = {
      type: 'match_created',
      title: 'Es un match',
      message: 'Ya pueden coordinar su duo.',
      data: { connectionId: connection.id, url: '/matches' },
    };

    await Notification.create({ userId: users.mid.id, ...notificationData });
    await Notification.create({ userId: users.jungle.id, ...notificationData });

    console.log('Seed de demo listo.');
    console.log('Cuentas:');
    for (const player of demoPlayers) {
      console.log(`- ${player.email} / ${DEMO_PASSWORD}`);
    }
    console.log('Match activo: demo_mid <-> demo_jungle');
    console.log('Like pendiente: demo_adc -> demo_mid');
  } finally {
    await sequelize.close();
  }
};

main().catch((error) => {
  console.error('No se pudo ejecutar el seed de demo:', error.message);
  process.exit(1);
});
