export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      notifications_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      type VARCHAR(40) NOT NULL,
      title VARCHAR(200) NOT NULL,
      message TEXT,
      data JSONB NOT NULL DEFAULT '{}'::jsonb,
      is_read BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON notifications (user_id, is_read)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS notifications_user_created_idx ON notifications (user_id, created_at)'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS notifications');
}
