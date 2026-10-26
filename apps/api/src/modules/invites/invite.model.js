import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';
import AvailabilitySession from '../availability/availability.model.js';

class Invite extends Model {}

Invite.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'invites_id',
    },
    fromUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'from_user_id',
    },
    toUserId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'to_user_id',
    },
    availabilityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'availability_id',
    },
    role: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING(140),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'pending',
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'expires_at',
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'responded_at',
    },
  },
  {
    sequelize,
    modelName: 'Invite',
    tableName: 'invites',
    underscored: true,
  }
);

Invite.belongsTo(User, { foreignKey: 'fromUserId', as: 'fromUser' });
Invite.belongsTo(User, { foreignKey: 'toUserId', as: 'toUser' });
Invite.belongsTo(AvailabilitySession, {
  foreignKey: 'availabilityId',
  as: 'availability',
});

export default Invite;
