export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_country_check;
    ALTER TABLE player_profiles
      ADD CONSTRAINT player_profiles_country_check
      CHECK (country IS NULL OR country IN ('AR', 'CL', 'BO', 'PY', 'UY', 'PE'));
  `);
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    UPDATE player_profiles SET country = NULL WHERE country = 'PE';
    ALTER TABLE player_profiles
      DROP CONSTRAINT IF EXISTS player_profiles_country_check;
    ALTER TABLE player_profiles
      ADD CONSTRAINT player_profiles_country_check
      CHECK (country IS NULL OR country IN ('AR', 'CL', 'BO', 'PY', 'UY'));
  `);
}
