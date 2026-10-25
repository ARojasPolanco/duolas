import sequelize from '../src/config/database/database.js';
import { runMigrations } from '../src/config/database/migrator.js';

const main = async () => {
  try {
    await sequelize.authenticate();
    await runMigrations();
    console.log('El seed de admin se implementa en la Fase 6.');
  } finally {
    await sequelize.close();
  }
};

main().catch((error) => {
  console.error('No se pudo ejecutar el seed de admin:', error.message);
  process.exit(1);
});
