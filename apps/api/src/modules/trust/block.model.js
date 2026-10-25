import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';

class Block extends Model {}

Block.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'blocks_id',
    },
    blockerId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'blocker_id',
    },
    blockedId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'blocked_id',
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_deleted',
    },
  },
  {
    sequelize,
    modelName: 'Block',
    tableName: 'blocks',
    underscored: true,
  }
);

Block.belongsTo(User, { foreignKey: 'blockerId', as: 'blocker' });
Block.belongsTo(User, { foreignKey: 'blockedId', as: 'blocked' });

export default Block;
