import { Op } from 'sequelize';
import { RANK_TIER_INDEX } from '@duo-las/shared';
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
import Feedback from '../src/modules/trust/feedback.model.js';
import Report from '../src/modules/trust/report.model.js';
import Sanction from '../src/modules/trust/sanction.model.js';
import PushSubscription from '../src/modules/push/pushSubscription.model.js';
import AvailabilitySession from '../src/modules/availability/availability.model.js';
import Invite from '../src/modules/invites/invite.model.js';
import DuoPost from '../src/modules/duoPosts/duoPost.model.js';
import PostApplication from '../src/modules/duoPosts/postApplication.model.js';
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
  {
    key: 'top1',
    username: 'demo_top1',
    email: 'demo_top1@duolas.app',
    riotId: 'DemoTop1#LAS',
    primaryRole: 'top',
    secondaryRole: 'jungle',
    rankTier: 'platinum',
    rankDivision: 'i',
    rankLp: 54,
    playStyle: 'ranked',
    languages: ['es', 'en'],
    hasMic: true,
    scheduleBlocks: ['sun_early', 'sun_night'],
    bio: 'Top main, prefiero partidas con comunicación.',
    discordTag: 'demotop1',
    reputationPositive: 7,
    reputationNegative: 0,
    reputationScore: 78,
  },
  {
    key: 'mid2',
    username: 'demo_mid2',
    email: 'demo_mid2@duolas.app',
    riotId: 'DemoMid2#LAS',
    primaryRole: 'mid',
    secondaryRole: 'adc',
    rankTier: 'emerald',
    rankDivision: 'ii',
    rankLp: 12,
    playStyle: 'casual',
    languages: ['es'],
    hasMic: true,
    scheduleBlocks: ['mon_night', 'tue_night'],
    bio: 'Mid/adc para jugar tranqui después del trabajo.',
    discordTag: 'demomid2',
    reputationPositive: 3,
    reputationNegative: 1,
    reputationScore: 57,
  },
  {
    key: 'jungle2',
    username: 'demo_jungle2',
    email: 'demo_jungle2@duolas.app',
    riotId: 'DemoJungle2#LAS',
    primaryRole: 'jungle',
    secondaryRole: 'support',
    rankTier: 'diamond',
    rankDivision: 'iv',
    rankLp: 30,
    playStyle: 'ranked',
    languages: ['es', 'pt'],
    hasMic: true,
    scheduleBlocks: ['sun_early', 'sun_night'],
    bio: 'Jungla de visión y objetivos.',
    discordTag: 'demojungle2',
    reputationPositive: 5,
    reputationNegative: 1,
    reputationScore: 67,
  },
  {
    key: 'adc2',
    username: 'demo_adc2',
    email: 'demo_adc2@duolas.app',
    riotId: 'DemoAdc2#LAS',
    primaryRole: 'adc',
    secondaryRole: 'mid',
    rankTier: 'platinum',
    rankDivision: 'iii',
    rankLp: 41,
    playStyle: 'tryhard',
    languages: ['es', 'en'],
    hasMic: true,
    scheduleBlocks: ['mon_night', 'wed_night'],
    bio: 'ADC agresivo, busco support con voz.',
    discordTag: 'demoadc2',
    reputationPositive: 9,
    reputationNegative: 2,
    reputationScore: 73,
  },
  {
    key: 'support2',
    username: 'demo_support2',
    email: 'demo_support2@duolas.app',
    riotId: 'DemoSupport2#LAS',
    primaryRole: 'support',
    secondaryRole: 'adc',
    rankTier: 'emerald',
    rankDivision: 'iv',
    rankLp: 66,
    playStyle: 'casual',
    languages: ['es'],
    hasMic: false,
    scheduleBlocks: ['tue_night', 'thu_night'],
    bio: 'Support de enchanter, sin mic.',
    discordTag: 'demosupport2',
    reputationPositive: 2,
    reputationNegative: 0,
    reputationScore: 60,
  },
  {
    key: 'top2',
    username: 'demo_top2',
    email: 'demo_top2@duolas.app',
    riotId: 'DemoTop2#LAS',
    primaryRole: 'top',
    secondaryRole: 'mid',
    rankTier: 'gold',
    rankDivision: 'i',
    rankLp: 88,
    playStyle: 'ranked',
    languages: ['es'],
    hasMic: true,
    scheduleBlocks: ['sat_afternoon', 'sun_afternoon'],
    bio: 'Top de tanques para ranked de fin de semana.',
    discordTag: 'demotop2',
    reputationPositive: 4,
    reputationNegative: 2,
    reputationScore: 55,
  },
  {
    key: 'jungle3',
    username: 'demo_jungle3',
    email: 'demo_jungle3@duolas.app',
    riotId: 'DemoJungle3#LAS',
    primaryRole: 'jungle',
    secondaryRole: 'mid',
    rankTier: 'emerald',
    rankDivision: 'i',
    rankLp: 7,
    playStyle: 'tryhard',
    languages: ['es', 'en'],
    hasMic: true,
    scheduleBlocks: ['sun_early', 'sun_night'],
    bio: 'Jungla carry para subir de elo.',
    discordTag: 'demojungle3',
    reputationPositive: 11,
    reputationNegative: 1,
    reputationScore: 81,
  },
  {
    key: 'support3',
    username: 'demo_support3',
    email: 'demo_support3@duolas.app',
    riotId: 'DemoSupport3#LAS',
    primaryRole: 'support',
    secondaryRole: 'jungle',
    rankTier: 'platinum',
    rankDivision: 'ii',
    rankLp: 19,
    playStyle: 'ranked',
    languages: ['es'],
    hasMic: true,
    scheduleBlocks: ['mon_night', 'fri_night'],
    bio: 'Support de engage, hablo por Discord.',
    discordTag: 'demosupport3',
    reputationPositive: 6,
    reputationNegative: 0,
    reputationScore: 76,
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

const createOrUpdateDemoAdmin = async () => {
  const now = new Date();
  const [admin, created] = await User.findOrCreate({
    where: { email: 'demo_admin@duolas.app' },
    defaults: {
      username: 'demo_admin',
      password: DEMO_PASSWORD,
      role: 'admin',
      emailVerified: true,
      ageConfirmedAt: now,
      termsAcceptedAt: now,
      lastActiveAt: now,
    },
  });

  if (!created) {
    await admin.update({
      password: DEMO_PASSWORD,
      role: 'admin',
      emailVerified: true,
      status: 'active',
      suspendedUntil: null,
      suspensionReason: null,
      isDeleted: false,
      lastActiveAt: now,
    });
  }

  return admin;
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

    await createOrUpdateDemoAdmin();
    const demoIds = Object.values(users).map((user) => user.id);
    const demoPostIds = (
      await DuoPost.findAll({
        where: { ownerId: { [Op.in]: demoIds } },
        attributes: ['id'],
      })
    ).map((post) => post.id);

    await PostApplication.destroy({
      where: { postId: { [Op.in]: demoPostIds } },
    });
    await DuoPost.destroy({ where: { ownerId: { [Op.in]: demoIds } } });
    await Invite.destroy({
      where: {
        [Op.or]: [{ fromUserId: { [Op.in]: demoIds } }, { toUserId: { [Op.in]: demoIds } }],
      },
    });
    await AvailabilitySession.destroy({
      where: { userId: { [Op.in]: demoIds } },
    });

    await Sanction.destroy({
      where: {
        [Op.or]: [{ userId: { [Op.in]: demoIds } }, { adminId: { [Op.in]: demoIds } }],
      },
    });
    await Feedback.destroy({
      where: {
        [Op.or]: [{ authorId: { [Op.in]: demoIds } }, { targetId: { [Op.in]: demoIds } }],
      },
    });
    await Report.destroy({
      where: {
        [Op.or]: [{ reporterId: { [Op.in]: demoIds } }, { reportedId: { [Op.in]: demoIds } }],
      },
    });

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
    await PushSubscription.destroy({ where: { userId: { [Op.in]: demoIds } } });
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

    await Feedback.create({
      connectionId: connection.id,
      authorId: users.jungle.id,
      targetId: users.mid.id,
      sentiment: 'positive',
      tags: ['good_vibes', 'communicative'],
      comment: 'Buen duo, buena comunicación.',
      visibleAt: null,
    });

    const now = new Date();
    const availability = await AvailabilitySession.create({
      userId: users.support.id,
      roles: ['support'],
      queue: 'solo_duo',
      note: 'Disponible para jugar ahora.',
      status: 'active',
      startedAt: now,
      expiresAt: new Date(now.getTime() + 30 * 60 * 1000),
    });

    const invite = await Invite.create({
      fromUserId: users.adc.id,
      toUserId: users.support.id,
      availabilityId: availability.id,
      role: 'support',
      message: '¿Jugamos unas ranked?',
      status: 'pending',
      expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
    });

    await Notification.create({
      userId: users.support.id,
      type: 'invite_received',
      title: 'Nueva invitación',
      message: 'demo_adc te invitó a jugar como support.',
      data: { inviteId: invite.id, url: '/invitaciones' },
    });

    const diamondIndex = RANK_TIER_INDEX.diamond;
    const post = await DuoPost.create({
      ownerId: users.adc.id,
      queue: 'flex',
      rolesNeeded: ['jungle'],
      rankMinTier: 'diamond',
      rankMaxTier: 'diamond',
      rankMinIndex: diamondIndex * 4,
      rankMaxIndex: diamondIndex * 4 + 3,
      note: 'Somos 4, falta jungla para flex.',
      status: 'active',
      expiresAt: new Date(now.getTime() + 2 * 60 * 60 * 1000),
    });

    const application = await PostApplication.create({
      postId: post.id,
      applicantId: users.mid.id,
      message: 'Puedo jungla.',
      status: 'pending',
    });

    await Notification.create({
      userId: users.adc.id,
      type: 'application_received',
      title: 'Nueva postulación',
      message: 'demo_mid se postuló a tu Busco 1.',
      data: { postId: post.id, applicationId: application.id, url: '/busco-1' },
    });

    await Report.create({
      reporterId: users.support.id,
      reportedId: users.jungle.id,
      reason: 'toxicity',
      details: 'Insultos durante la partida.',
      status: 'open',
      priority: false,
    });

    await Block.create({
      blockerId: users.support.id,
      blockedId: users.jungle.id,
    });

    console.log('Seed de demo listo.');
    console.log('Cuentas:');
    for (const player of demoPlayers) {
      console.log(`- ${player.email} / ${DEMO_PASSWORD}`);
    }
    console.log(`- demo_admin@duolas.app / ${DEMO_PASSWORD} (admin)`);
    console.log('Match activo: demo_mid <-> demo_jungle');
    console.log('Like pendiente: demo_adc -> demo_mid');
    console.log('Disponible ya: demo_support');
    console.log('Invitación pendiente: demo_adc -> demo_support');
    console.log('Busco 1: demo_adc (flex, jungla) con postulación de demo_mid');
    console.log('Feedback pendiente: demo_jungle -> demo_mid');
    console.log('Reporte abierto: demo_support -> demo_jungle');
  } finally {
    await sequelize.close();
  }
};

main().catch((error) => {
  console.error('No se pudo ejecutar el seed de demo:', error.message);
  process.exit(1);
});
