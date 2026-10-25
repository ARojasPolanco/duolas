export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS duo_likes (
      duo_likes_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      from_user_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      to_user_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      status VARCHAR(10) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT duo_likes_status_check CHECK (status IN ('pending', 'matched', 'cancelled')),
      CONSTRAINT duo_likes_distinct_check CHECK (from_user_id <> to_user_id)
    )
  `);

  await queryInterface.sequelize.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS duo_likes_pair_idx ON duo_likes (from_user_id, to_user_id)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS duo_likes_to_status_idx ON duo_likes (to_user_id, status)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS duo_likes_from_status_idx ON duo_likes (from_user_id, status)'
  );

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS duo_connections (
      duo_connections_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_low_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      user_high_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      source VARCHAR(12) NOT NULL,
      status VARCHAR(10) NOT NULL DEFAULT 'active',
      contact_revealed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      archived_at TIMESTAMPTZ,
      archived_by UUID REFERENCES users(users_id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT duo_connections_source_check CHECK (source IN ('like', 'availability', 'post')),
      CONSTRAINT duo_connections_status_check CHECK (status IN ('active', 'archived')),
      CONSTRAINT duo_connections_pair_order_check CHECK (user_low_id < user_high_id)
    )
  `);

  await queryInterface.sequelize.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS duo_connections_pair_idx ON duo_connections (user_low_id, user_high_id)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS duo_connections_low_status_idx ON duo_connections (user_low_id, status)'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS duo_connections_high_status_idx ON duo_connections (user_high_id, status)'
  );

  await queryInterface.sequelize.query(`
    CREATE TABLE IF NOT EXISTS blocks (
      blocks_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      blocker_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      blocked_id UUID NOT NULL REFERENCES users(users_id) ON DELETE CASCADE,
      is_deleted BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT blocks_distinct_check CHECK (blocker_id <> blocked_id)
    )
  `);

  await queryInterface.sequelize.query(
    'CREATE UNIQUE INDEX IF NOT EXISTS blocks_active_pair_idx ON blocks (blocker_id, blocked_id) WHERE is_deleted = false'
  );
  await queryInterface.sequelize.query(
    'CREATE INDEX IF NOT EXISTS blocks_blocked_idx ON blocks (blocked_id)'
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS blocks');
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS duo_connections');
  await queryInterface.sequelize.query('DROP TABLE IF EXISTS duo_likes');
}
