import { Sequelize } from 'sequelize';
import { envs } from '../enviroments.js';

const databaseUri = envs.NODE_ENV === 'test' ? envs.TEST_DB_URI : envs.DB_URI;

const sequelize = new Sequelize(databaseUri, {
  dialect: 'postgres',
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
  },
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 3,
    timeout: 30000,
  },
});

export default sequelize;
