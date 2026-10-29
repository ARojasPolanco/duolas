import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';

class UsernameChangeRequest extends Model {}

UsernameChangeRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'username_change_requests_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'admin_id',
    },
    suggestedUsername: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'suggested_username',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending_user',
      validate: {
        isIn: [['pending_user', 'pending_admin', 'approved', 'rejected']],
      },
    },
    adminNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'admin_note',
    },
    resolutionNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'resolution_note',
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
    },
  },
  {
    sequelize,
    modelName: 'UsernameChangeRequest',
    tableName: 'username_change_requests',
    underscored: true,
  }
);

UsernameChangeRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UsernameChangeRequest.belongsTo(User, { foreignKey: 'admin_id', as: 'admin' });
User.hasMany(UsernameChangeRequest, { foreignKey: 'user_id', as: 'usernameChangeRequests' });

export default UsernameChangeRequest;
