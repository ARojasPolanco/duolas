import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/database/database.js';
import { hashPassword } from '../../config/plugins/encrypted-password.js';

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      field: 'users_id',
    },
    username: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      set(value) {
        this.setDataValue('email', String(value).trim().toLowerCase());
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'player',
      validate: { isIn: [['player', 'admin']] },
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'email_verified',
    },
    emailVerificationToken: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'email_verification_token',
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'email_verification_expires',
    },
    passwordResetToken: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'password_reset_token',
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'password_reset_expires',
    },
    changedPasswordAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'changed_password_at',
    },
    ageConfirmedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'age_confirmed_at',
    },
    termsAcceptedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'terms_accepted_at',
    },
    status: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: 'active',
      validate: { isIn: [['active', 'suspended']] },
    },
    suspendedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'suspended_until',
    },
    suspensionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'suspension_reason',
    },
    warningCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'warning_count',
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at',
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_active_at',
    },
    isDeleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_deleted',
    },
    deletionRequestedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deletion_requested_at',
    },
    deletionScheduledFor: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deletion_scheduled_for',
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    underscored: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await hashPassword(user.password);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await hashPassword(user.password);
        }
      },
    },
  }
);

export default User;
