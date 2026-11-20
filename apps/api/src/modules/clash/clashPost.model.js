import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';

class ClashPost extends Model {}

ClashPost.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'clash_posts_id',
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'owner_id',
    },
    teamName: {
      type: DataTypes.STRING(40),
      allowNull: false,
      field: 'team_name',
    },
    day: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    captainRole: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'captain_role',
    },
    rolesNeeded: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      field: 'roles_needed',
    },
    rankMinTier: {
      type: DataTypes.STRING(12),
      allowNull: false,
      field: 'rank_min_tier',
    },
    rankMaxTier: {
      type: DataTypes.STRING(12),
      allowNull: false,
      field: 'rank_max_tier',
    },
    rankMinIndex: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: 'rank_min_index',
    },
    rankMaxIndex: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: 'rank_max_index',
    },
    note: {
      type: DataTypes.STRING(280),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'active',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
  },
  {
    sequelize,
    modelName: 'ClashPost',
    tableName: 'clash_posts',
    underscored: true,
  }
);

ClashPost.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

export default ClashPost;
