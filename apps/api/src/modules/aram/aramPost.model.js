import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';

class AramPost extends Model {}

AramPost.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'aram_posts_id',
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'owner_id',
    },
    mode: {
      type: DataTypes.STRING(8),
      allowNull: false,
    },
    playersPresent: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: 'players_present',
    },
    slotsNeeded: {
      type: DataTypes.SMALLINT,
      allowNull: false,
      field: 'slots_needed',
    },
    window: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: 'time_window',
    },
    hasMic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'has_mic',
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
    modelName: 'AramPost',
    tableName: 'aram_posts',
    underscored: true,
  }
);

AramPost.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

export default AramPost;
