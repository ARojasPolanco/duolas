import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';
import DuoPost from './duoPost.model.js';

class PostApplication extends Model {}

PostApplication.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'post_applications_id',
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
    message: {
      type: DataTypes.STRING(140),
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
    modelName: 'PostApplication',
    tableName: 'post_applications',
    underscored: true,
  }
);

PostApplication.belongsTo(DuoPost, { foreignKey: 'postId', as: 'post' });
PostApplication.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant' });

export default PostApplication;
