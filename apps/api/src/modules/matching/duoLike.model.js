import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';

class DuoLike extends Model {}

DuoLike.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'duo_likes_id',
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
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'pending',
      validate: { isIn: [['pending', 'matched', 'cancelled']] },
    },
  },
  {
    sequelize,
    modelName: 'DuoLike',
    tableName: 'duo_likes',
    underscored: true,
  }
);

DuoLike.belongsTo(User, { foreignKey: 'fromUserId', as: 'fromUser' });
DuoLike.belongsTo(User, { foreignKey: 'toUserId', as: 'toUser' });

export default DuoLike;
