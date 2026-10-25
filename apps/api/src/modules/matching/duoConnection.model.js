import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';

class DuoConnection extends Model {}

DuoConnection.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'duo_connections_id',
    },
    userLowId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_low_id',
    },
    userHighId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_high_id',
    },
    source: {
      type: DataTypes.STRING(12),
      allowNull: false,
      validate: { isIn: [['like', 'availability', 'post']] },
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [['active', 'archived']] },
    },
    contactRevealedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'contact_revealed_at',
    },
    archivedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'archived_at',
    },
    archivedBy: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'archived_by',
    },
  },
  {
    sequelize,
    modelName: 'DuoConnection',
    tableName: 'duo_connections',
    underscored: true,
  }
);

DuoConnection.belongsTo(User, { foreignKey: 'userLowId', as: 'userLow' });
DuoConnection.belongsTo(User, { foreignKey: 'userHighId', as: 'userHigh' });
DuoConnection.belongsTo(User, { foreignKey: 'archivedBy', as: 'archivedByUser' });

export default DuoConnection;
