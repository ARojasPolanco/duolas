export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(
    'ALTER TABLE player_profiles ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20)'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query(
    'ALTER TABLE player_profiles DROP COLUMN IF EXISTS whatsapp'
  );
}
