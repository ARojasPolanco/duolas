export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(
    'ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS country CHAR(2)'
  );
  await queryInterface.sequelize.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'player_profiles_country_check'
      ) THEN
        ALTER TABLE player_profiles
        ADD CONSTRAINT player_profiles_country_check
        CHECK (country IS NULL OR country IN ('AR', 'CL', 'BO', 'PY', 'UY'));
      END IF;
    END $$;
  `);
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query(
    'ALTER TABLE player_profiles DROP CONSTRAINT IF EXISTS player_profiles_country_check'
  );
  await queryInterface.sequelize.query('ALTER TABLE player_profiles DROP COLUMN IF EXISTS country');
}
