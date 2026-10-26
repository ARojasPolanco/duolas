import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';
import Report from './report.model.js';

class Sanction extends Model {}

Sanction.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'sanctions_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'admin_id',
    },
    reportId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'report_id',
    },
    action: {
      type: DataTypes.STRING(24),
      allowNull: false,
      validate: {
        isIn: [['warned', 'suspended_7d', 'suspended_30d', 'suspended_permanent']],
      },
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expires_at',
    },
  },
  {
    sequelize,
    modelName: 'Sanction',
    tableName: 'sanctions',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);

Sanction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Sanction.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });
Sanction.belongsTo(Report, { foreignKey: 'reportId', as: 'report' });

export default Sanction;
