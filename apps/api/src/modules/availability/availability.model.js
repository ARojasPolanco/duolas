import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';

class AvailabilitySession extends Model {}

AvailabilitySession.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'availability_sessions_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    roles: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
    },
    queue: {
      type: DataTypes.STRING(10),
      allowNull: false,
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
    startedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'started_at',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    endedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'ended_at',
    },
    closedReason: {
      type: DataTypes.STRING(10),
      allowNull: true,
      field: 'closed_reason',
    },
  },
  {
    sequelize,
    modelName: 'AvailabilitySession',
    tableName: 'availability_sessions',
    underscored: true,
  }
);

AvailabilitySession.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default AvailabilitySession;
