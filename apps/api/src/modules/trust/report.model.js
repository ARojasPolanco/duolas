import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';

class Report extends Model {}

Report.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'reports_id',
    },
    reporterId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'reporter_id',
    },
    reportedId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'reported_id',
    },
    reason: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['toxicity', 'fake_rank', 'abandonment', 'spam', 'underage', 'other']],
      },
    },
    details: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'open',
      validate: { isIn: [['open', 'reviewing', 'resolved', 'dismissed']] },
    },
    priority: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    adminId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'admin_id',
    },
    adminNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'admin_note',
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'resolved_at',
    },
  },
  {
    sequelize,
    modelName: 'Report',
    tableName: 'reports',
    underscored: true,
  }
);

Report.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
Report.belongsTo(User, { foreignKey: 'reportedId', as: 'reported' });
Report.belongsTo(User, { foreignKey: 'adminId', as: 'admin' });

export default Report;
