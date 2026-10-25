import { Op } from 'sequelize';
import { RANK_DIVISION_INDEX, RANK_TIER_INDEX, normalizeRiotId } from '@duo-las/shared';
import PlayerProfile from './profile.model.js';
import User from '../auth/auth.model.js';
import { AppError } from '../../errors/appError.js';

const APEX_TIERS = ['master', 'grandmaster', 'challenger'];

const isApexTier = (tier) => APEX_TIERS.includes(tier);

const computeRankIndex = (tier, division) => {
  const tierIndex = RANK_TIER_INDEX[tier];
  if (tierIndex === undefined) return null;

  if (isApexTier(tier)) return tierIndex * 4;

  const divisionIndex = RANK_DIVISION_INDEX[division];
  if (divisionIndex === undefined) return null;

  return tierIndex * 4 + divisionIndex;
};

const unique = (values) => Array.from(new Set(values || []));

const normalizeNullableText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
};

const reputationOf = (profile) => {
  const positive = profile.reputationPositive || 0;
  const negative = profile.reputationNegative || 0;
  const total = positive + negative;
  return {
    score: profile.reputationScore,
    positive,
    negative,
    total,
    label: total >= 3 ? `${profile.reputationScore}%` : 'Nuevo',
  };
};

const missingFields = (profile) => {
  const missing = [];

  if (!profile?.riotId) missing.push('Riot ID');
  if (!profile?.primaryRole) missing.push('Rol principal');
  if (!profile?.secondaryRole) missing.push('Rol secundario');
  if (!profile?.rankTier) missing.push('Rango');
  if (profile?.rankTier && !isApexTier(profile.rankTier) && !profile.rankDivision) {
    missing.push('División');
  }
  if (!profile?.playStyle) missing.push('Estilo de juego');
  if (!profile?.languages?.length) missing.push('Idiomas');
  if (typeof profile?.hasMic !== 'boolean') missing.push('Micrófono');
  if (!profile?.scheduleBlocks?.length) missing.push('Horarios');

  return missing;
};

const toPrivateProfile = (profile, user) => ({
  id: user.id,
  username: user.username,
  riotId: profile.riotId,
  server: profile.server,
  primaryRole: profile.primaryRole,
  secondaryRole: profile.secondaryRole,
  rankTier: profile.rankTier,
  rankDivision: profile.rankDivision,
  rankLp: profile.rankLp,
  rankSource: profile.rankSource,
  playStyle: profile.playStyle,
  languages: profile.languages,
  hasMic: profile.hasMic,
  scheduleBlocks: profile.scheduleBlocks,
  bio: profile.bio,
  discordTag: profile.discordTag,
  reputation: reputationOf(profile),
  availabilityActive: false,
  profileCompletedAt: profile.profileCompletedAt,
  createdAt: profile.createdAt,
});

const toPublicProfile = (profile, user) => ({
  id: user.id,
  username: user.username,
  primaryRole: profile.primaryRole,
  secondaryRole: profile.secondaryRole,
  rankTier: profile.rankTier,
  rankDivision: profile.rankDivision,
  rankLp: profile.rankLp,
  rankSource: profile.rankSource,
  playStyle: profile.playStyle,
  languages: profile.languages,
  hasMic: profile.hasMic,
  scheduleBlocks: profile.scheduleBlocks,
  bio: profile.bio,
  reputation: reputationOf(profile),
  availabilityActive: false,
  stats: { connections: 0 },
  createdAt: user.createdAt,
});

export class ProfileService {
  async findByUserId(userId) {
    return PlayerProfile.findOne({ where: { userId, isDeleted: false } });
  }

  async getCompleteness(userId) {
    const profile = await this.findByUserId(userId);
    const missing = missingFields(profile);
    return {
      completed: missing.length === 0,
      missing: missing.length ? missing : [],
      profile,
    };
  }

  async getMe(user) {
    const profile = await this.findByUserId(user.id);
    const missing = missingFields(profile);
    return {
      profile: profile ? toPrivateProfile(profile, user) : null,
      completeness: {
        completed: missing.length === 0,
        missing: missing.length ? missing : [],
      },
    };
  }

  async upsert(userId, data) {
    const current = await this.findByUserId(userId);

    const merged = {
      riotId: data.riotId !== undefined ? data.riotId.trim() : current?.riotId,
      primaryRole: data.primaryRole !== undefined ? data.primaryRole : current?.primaryRole,
      secondaryRole: data.secondaryRole !== undefined ? data.secondaryRole : current?.secondaryRole,
      rankTier: data.rankTier !== undefined ? data.rankTier : current?.rankTier,
      rankDivision: data.rankDivision !== undefined ? data.rankDivision : current?.rankDivision,
      rankLp: data.rankLp !== undefined ? data.rankLp : current?.rankLp,
      playStyle: data.playStyle !== undefined ? data.playStyle : current?.playStyle,
      languages: data.languages !== undefined ? unique(data.languages) : current?.languages,
      hasMic: data.hasMic !== undefined ? data.hasMic : current?.hasMic,
      scheduleBlocks:
        data.scheduleBlocks !== undefined ? unique(data.scheduleBlocks) : current?.scheduleBlocks,
      bio: data.bio !== undefined ? normalizeNullableText(data.bio) : current?.bio,
      discordTag:
        data.discordTag !== undefined
          ? normalizeNullableText(data.discordTag)
          : current?.discordTag,
    };

    if (merged.primaryRole && merged.primaryRole === merged.secondaryRole) {
      throw new AppError('El rol principal y el secundario deben ser distintos.', 422);
    }

    if (merged.rankTier && isApexTier(merged.rankTier)) {
      merged.rankDivision = null;
    }

    const missing = missingFields(merged);
    if (missing.length) {
      throw new AppError(`Faltan campos obligatorios: ${missing.join(', ')}.`, 422);
    }

    const rankIndex = computeRankIndex(merged.rankTier, merged.rankDivision);
    if (rankIndex === null) {
      throw new AppError('El rango o la división no son válidos.', 422);
    }

    const riotIdNormalized = normalizeRiotId(merged.riotId);
    const duplicate = await PlayerProfile.findOne({
      where: { riotIdNormalized, isDeleted: false },
    });
    if (duplicate && duplicate.userId !== userId) {
      throw new AppError('Ese Riot ID ya está en uso.', 409);
    }

    const payload = {
      userId,
      riotId: merged.riotId,
      riotIdNormalized,
      server: 'LAS',
      primaryRole: merged.primaryRole,
      secondaryRole: merged.secondaryRole,
      rankTier: merged.rankTier,
      rankDivision: merged.rankDivision,
      rankLp: merged.rankLp ?? null,
      rankIndex,
      playStyle: merged.playStyle,
      languages: merged.languages,
      hasMic: merged.hasMic,
      scheduleBlocks: merged.scheduleBlocks,
      bio: merged.bio ?? null,
      discordTag: merged.discordTag ?? null,
      rankSource: current?.rankSource || 'declared',
      profileCompletedAt: current?.profileCompletedAt || new Date(),
      isDeleted: false,
    };

    try {
      if (current) {
        return await current.update(payload);
      }
      return await PlayerProfile.create(payload);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Ese Riot ID ya está en uso.', 409);
      }
      throw error;
    }
  }

  async getPublicById(userId) {
    const profile = await PlayerProfile.findOne({
      where: {
        userId,
        isDeleted: false,
        profileCompletedAt: { [Op.ne]: null },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'role', 'status', 'isDeleted', 'createdAt'],
          where: { isDeleted: false, status: 'active' },
          required: true,
        },
      ],
    });

    if (!profile) return null;
    return toPublicProfile(profile, profile.user);
  }
}

export const profileService = new ProfileService();
export { computeRankIndex, missingFields };
