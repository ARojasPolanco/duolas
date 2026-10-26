import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';
import DuoConnection from '../matching/duoConnection.model.js';

class Feedback extends Model {}

Feedback.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'feedbacks_id',
    },
    connectionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'connection_id',
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'author_id',
    },
    targetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'target_id',
    },
    sentiment: {
      type: DataTypes.STRING(8),
      allowNull: false,
      validate: { isIn: [['positive', 'negative']] },
    },
    tags: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      allowNull: false,
      defaultValue: [],
    },
    comment: {
      type: DataTypes.STRING(280),
      allowNull: true,
    },
    visibleAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'visible_at',
    },
  },
  {
    sequelize,
    modelName: 'Feedback',
    tableName: 'feedbacks',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);

Feedback.belongsTo(DuoConnection, { foreignKey: 'connectionId', as: 'connection' });
Feedback.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
Feedback.belongsTo(User, { foreignKey: 'targetId', as: 'target' });

export default Feedback;
