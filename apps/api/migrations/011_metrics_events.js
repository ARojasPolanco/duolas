export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS metrics_events (
      metrics_events_id BIGSERIAL PRIMARY KEY,
      user_id UUID REFERENCES users(users_id) ON DELETE SET NULL,
      type VARCHAR(40) NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS metrics_events_type_created_idx ON metrics_events (type, created_at)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS metrics_events_user_created_idx ON metrics_events (user_id, created_at)'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS metrics_events');
}
