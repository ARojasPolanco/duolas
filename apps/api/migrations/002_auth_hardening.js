export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS changed_password_at TIMESTAMPTZ'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query(
    'ALTER TABLE users DROP COLUMN IF EXISTS changed_password_at'
  );
}
