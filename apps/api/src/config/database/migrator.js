import { Umzug, SequelizeStorage } from 'umzug';
import sequelize from './database.js';

const migrator = new Umzug({
  migrations: {
    glob: ['migrations/*.js', { cwd: process.cwd() }],
  },
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

export const runMigrations = async () => {
  await migrator.up();
};

export const rollbackMigrations = async () => {
  await migrator.down();
};

export default migrator;
