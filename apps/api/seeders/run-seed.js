import sequelize from '../src/config/database/database.js';
import { runMigrations } from '../src/config/database/migrator.js';

const main = async () => {
  try {
    await sequelize.authenticate();
    await runMigrations();
    console.log('Seeds de desarrollo pendientes para fases posteriores.');
  } finally {
    await sequelize.close();
  }
};

main().catch((error) => {
  console.error('No se pudieron ejecutar los seeds:', error.message);
  process.exit(1);
});
