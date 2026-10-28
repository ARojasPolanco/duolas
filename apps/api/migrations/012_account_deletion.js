export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_requested_at TIMESTAMPTZ'
  );
  await queryInterface.sequelize.query(
    'ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_scheduled_for TIMESTAMPTZ'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS users_deletion_scheduled_idx ON users (deletion_scheduled_for) WHERE is_deleted = true'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query('DROP INDEX IF EXISTS users_deletion_scheduled_idx');
  await queryInterface.sequelize.query(
    'ALTER TABLE users DROP COLUMN IF EXISTS deletion_scheduled_for'
  );
  await queryInterface.sequelize.query(
    'ALTER TABLE users DROP COLUMN IF EXISTS deletion_requested_at'
  );
}
