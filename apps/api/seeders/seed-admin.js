import sequelize from '../src/config/database/database.js';
import { runMigrations } from '../src/config/database/migrator.js';
import { envs } from '../src/config/enviroments.js';
import User from '../src/modules/auth/auth.model.js';

const main = async () => {
  if (!envs.ADMIN_EMAIL || !envs.ADMIN_PASSWORD) {
    throw new Error('Configurá ADMIN_EMAIL y ADMIN_PASSWORD para crear el admin.');
  }

  try {
    await sequelize.authenticate();
    await runMigrations();

    const now = new Date();
    const username = envs.ADMIN_EMAIL.split('@')[0].slice(0, 20);
    const [admin, created] = await User.findOrCreate({
      where: { email: envs.ADMIN_EMAIL.toLowerCase() },
      defaults: {
        username,
        password: envs.ADMIN_PASSWORD,
        role: 'admin',
        emailVerified: true,
        ageConfirmedAt: now,
        termsAcceptedAt: now,
        lastActiveAt: now,
      },
    });

    if (!created) {
      await admin.update({
        password: envs.ADMIN_PASSWORD,
        role: 'admin',
        emailVerified: true,
        status: 'active',
        suspendedUntil: null,
        suspensionReason: null,
        isDeleted: false,
        lastActiveAt: now,
      });
    }

    console.log(`Admin listo: ${admin.email} (${admin.username})`);
  } finally {
    await sequelize.close();
  }
};

main().catch((error) => {
  console.error('No se pudo ejecutar el seed de admin:', error.message);
  process.exit(1);
});
