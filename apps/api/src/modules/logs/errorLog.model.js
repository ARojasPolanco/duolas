import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';

class ErrorLog extends Model {}

ErrorLog.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
      field: 'errors_id',
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    statusCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'status_code',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    stack: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    method: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'user_id',
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent',
    },
    isOperational: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      field: 'is_operational',
    },
  },
  {
    sequelize,
    modelName: 'ErrorLog',
    tableName: 'errors',
    underscored: true,
    timestamps: true,
    updatedAt: false,
  }
);

export default ErrorLog;
