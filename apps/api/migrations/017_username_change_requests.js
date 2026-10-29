export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS username_change_requests (
      username_change_requests_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      admin_id UUID REFERENCES users(users_id) ON DELETE SET NULL,
      suggested_username VARCHAR(20),
      status VARCHAR(20) NOT NULL DEFAULT 'pending_user',
      admin_note VARCHAR(500),
      resolution_note VARCHAR(500),
      resolved_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT username_change_requests_status_check CHECK (
        status IN ('pending_user', 'pending_admin', 'approved', 'rejected')
      ),
      CONSTRAINT username_change_requests_suggestion_check CHECK (
        status IN ('pending_user', 'rejected')
        OR suggested_username IS NOT NULL
      )
    )
  `);

  await queryInterface.sequelize.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS username_change_requests_open_user_idx
      ON username_change_requests (user_id)
      WHERE status IN ('pending_user', 'pending_admin')
  `);
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS username_change_requests_status_created_idx ON username_change_requests (status, created_at)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS username_change_requests_admin_idx ON username_change_requests (admin_id, status)'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS username_change_requests');
}
