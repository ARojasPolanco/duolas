import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';

class MetricsEvent extends Model {}

MetricsEvent.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      field: 'metrics_events_id',
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
    },
    type: {
      type: DataTypes.STRING(40),
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'MetricsEvent',
    tableName: 'metrics_events',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);

MetricsEvent.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default MetricsEvent;
