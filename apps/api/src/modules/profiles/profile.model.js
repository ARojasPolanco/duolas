import { DataTypes, Model } from 'sequelize';
import { COUNTRIES } from '@duo-las/shared';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';

class PlayerProfile extends Model {}

PlayerProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'player_profiles_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
    },
    riotId: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: 'riot_id',
    },
    riotIdNormalized: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      field: 'riot_id_normalized',
    },
    server: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'LAS',
      validate: { isIn: [['LAS']] },
    },
    country: {
      type: DataTypes.STRING(2),
      allowNull: true,
      validate: { isIn: [COUNTRIES] },
    },
    primaryRole: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'primary_role',
    },
    secondaryRole: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'secondary_role',
    },
    rankTier: {
      type: DataTypes.STRING(12),
      allowNull: false,
      field: 'rank_tier',
    },
    rankDivision: {
      type: DataTypes.STRING(3),
      allowNull: true,
      field: 'rank_division',
    },
    rankLp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'rank_lp',
    },
    rankIndex: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: 'rank_index',
    },
    playStyle: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'play_style',
    },
    languages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    hasMic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      field: 'has_mic',
    },
    scheduleBlocks: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      field: 'schedule_blocks',
    },
    bio: {
      type: DataTypes.STRING(280),
      allowNull: true,
    },
    discordTag: {
      type: DataTypes.STRING(32),
      allowNull: true,
      field: 'discord_tag',
    },
    rankSource: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'declared',
      field: 'rank_source',
    },
    rankVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'rank_verified_at',
    },
    flexRankTier: {
      type: DataTypes.STRING(12),
      allowNull: true,
      field: 'flex_rank_tier',
    },
    flexRankDivision: {
      type: DataTypes.STRING(3),
      allowNull: true,
      field: 'flex_rank_division',
    },
    flexRankLp: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'flex_rank_lp',
    },
    flexRankIndex: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      field: 'flex_rank_index',
    },
    flexRankSource: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'declared',
      field: 'flex_rank_source',
    },
    reputationPositive: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'reputation_positive',
    },
    reputationNegative: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'reputation_negative',
    },
    reputationScore: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      defaultValue: 50,
      field: 'reputation_score',
    },
    reputationCalculatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reputation_calculated_at',
    },
    profileCompletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'profile_completed_at',
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_deleted',
    },
  },
  {
    sequelize,
    modelName: 'PlayerProfile',
    tableName: 'player_profiles',
    underscored: true,
  }
);

PlayerProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(PlayerProfile, { foreignKey: 'user_id', as: 'profile' });

export default PlayerProfile;
