import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';
import AramPost from './aramPost.model.js';

class AramApplication extends Model {}

AramApplication.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'aram_applications_id',
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
    modelName: 'AramApplication',
    tableName: 'aram_applications',
    underscored: true,
  }
);

AramApplication.belongsTo(AramPost, { foreignKey: 'postId', as: 'post' });
AramApplication.belongsTo(User, { foreignKey: 'applicantId', as: 'applicant' });

export default AramApplication;
