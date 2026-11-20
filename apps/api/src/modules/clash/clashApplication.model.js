import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';
import ClashPost from './clashPost.model.js';

class ClashApplication extends Model {}

ClashApplication.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'clash_applications_id',
    },
    postId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'post_id',
    },
    applicantId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'applicant_id',
    },
    role: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING(280),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'pending',
    },
  },
  {
    sequelize,
    modelName: 'ClashApplication',
    tableName: 'clash_applications',
    underscored: true,
  }
);

ClashApplication.belongsTo(ClashPost, { foreignKey: 'postId', as: 'post' });
ClashApplication.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant' });

export default ClashApplication;
