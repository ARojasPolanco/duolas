import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';

class DuoPost extends Model {}

DuoPost.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'duo_posts_id',
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'owner_id',
    },
    queue: {
      type: DataTypes.STRING(10),
      allowNull: false,
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
      type: DataTypes.STRING(140),
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
    modelName: 'DuoPost',
    tableName: 'duo_posts',
    underscored: true,
  }
);

DuoPost.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

export default DuoPost;
